// Supabase Edge Function (Deno runtime)
//
// Flow:
//   1. Fetch job + agent from Supabase
//   2. Call Gemini to generate the deliverable
//   3. Sign and send submitDelivery() on Arc Testnet (waits for confirmed receipt)
//   4. ONLY after onchain confirmation: update Supabase status='delivered' + tx_hash_delivery
//
// If any step fails, the job reverts to 'funded' in Supabase so Supabase and
// the contract never drift out of sync. The Supabase status 'delivered' is only
// ever written when the contract has also accepted the delivery.
//
// Onchain mode is enabled when all three secrets are set:
//   ESCROW_CONTRACT_ADDRESS, AGENT_PRIVATE_KEY, and the job has an onchain_job_id.
// Without them (simulation/local dev), the submitDelivery step is skipped.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai';
import { createWalletClient, createPublicClient, http, defineChain, keccak256, toHex } from 'npm:viem@2';
import { privateKeyToAccount } from 'npm:viem@2/accounts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRACT_ABI = [
  {
    name: 'submitDelivery',
    type: 'function',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'deliveryHash', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getJob',
    type: 'function',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'buyer',        type: 'address' },
        { name: 'agent',        type: 'address' },
        { name: 'amount',       type: 'uint256' },
        { name: 'status',       type: 'uint8'   },
        { name: 'deliveryHash', type: 'string'  },
      ],
    }],
    stateMutability: 'view',
  },
] as const;

// Mirrors JobStatus enum in ArcHireEscrow.sol
const JOB_STATUS_LABELS: Record<number, string> = {
  0: 'Funded', 1: 'InProgress', 2: 'Delivered',
  3: 'Released', 4: 'Disputed', 5: 'Refunded',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let jobId: string | undefined;

  try {
    const body = await req.json();
    jobId = body?.jobId as string | undefined;
    if (!jobId) throw new Error('jobId is required');

    // Service role key bypasses RLS so we can write without the user's JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch job + agent. Include onchain_job_id — needed for submitDelivery().
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, description, status, agent_id, onchain_job_id, agents(name, tagline, category, long_description)')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) throw new Error(`Job ${jobId} not found`);
    if ((job as any).status !== 'funded' && (job as any).status !== 'in_progress') {
      throw new Error(`Job is already in status '${(job as any).status}' — cannot start`);
    }

    // Mark in_progress immediately so the UI reflects real state.
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId);

    // ── Pre-flight: verify onchain job status before spending Gemini tokens ──
    // If the escrow slot is in a non-deliverable terminal state (Disputed, Released,
    // Refunded, or already Delivered), reject immediately — don't call Gemini,
    // don't broadcast a transaction that will revert, don't waste gas.
    const escrowAddress = Deno.env.get('ESCROW_CONTRACT_ADDRESS') as `0x${string}` | undefined;
    const agentPrivateKeyRaw = Deno.env.get('AGENT_PRIVATE_KEY');
    const onchainJobId = (job as any).onchain_job_id as string | null;
    const onchainModeEnabled = !!(escrowAddress && agentPrivateKeyRaw && onchainJobId != null);

    if (onchainModeEnabled) {
      const rpcUrl = Deno.env.get('ARC_RPC_URL') || 'https://rpc.testnet.arc.network';
      const arcTestnet = defineChain({
        id: 5042002,
        name: 'Arc Testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      });
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http(rpcUrl) });

      const onchainJob = await publicClient.readContract({
        address: escrowAddress!,
        abi: CONTRACT_ABI,
        functionName: 'getJob',
        args: [BigInt(onchainJobId!)],
      }) as { status: number };

      const onchainStatus = onchainJob.status;
      console.log(`[start-job] onchain job ${onchainJobId} status: ${JOB_STATUS_LABELS[onchainStatus] ?? onchainStatus}`);

      // 0=Funded, 1=InProgress are the only states submitDelivery accepts.
      if (onchainStatus !== 0 && onchainStatus !== 1) {
        const label = JOB_STATUS_LABELS[onchainStatus] ?? `unknown(${onchainStatus})`;
        throw new Error(
          `ONCHAIN_BLOCKED:${label}:Onchain escrow job #${onchainJobId} is in state '${label}' — submitDelivery requires Funded or InProgress. ` +
          (onchainStatus === 4
            ? 'This job was disputed. Admin must call refund() to release funds; a new job must be created to retry.'
            : onchainStatus === 2
            ? 'Job is already Delivered onchain — approveAndRelease() can proceed without retrying.'
            : `No delivery path available for state '${label}'.`)
        );
      }
    }

    // ── Build agent persona prompt ─────────────────────────────────────────
    const agent = (job as any).agents ?? {};
    const agentName: string = agent.name ?? 'AI Agent';
    const agentTagline: string = agent.tagline ?? 'specialized AI assistant';
    const agentCategory: string = agent.category ?? 'general';
    const agentLongDesc: string = agent.long_description ?? '';

    const systemPrompt = `You are ${agentName}, ${agentTagline}.
${agentLongDesc ? agentLongDesc + '\n' : ''}
You are a specialized AI agent on the ArcHire marketplace. A client has hired you and placed payment in an escrow smart contract. You specialize in ${agentCategory} tasks.

Complete the task below professionally and concisely. Respond directly with your deliverable — no meta-commentary about being an AI, no disclaimers, just the work product the client is paying for.`;

    // ── Step 1: Call Gemini ────────────────────────────────────────────────
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY secret is not set');

    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: geminiModel,
      config: { systemInstruction: systemPrompt },
      contents: [{ role: 'user', parts: [{ text: (job as any).description }] }],
    });

    const text = (response as any).text as string;
    if (!text) throw new Error('Gemini returned an empty response');

    // keccak256 of the raw delivery text — stored in Supabase and passed onchain.
    // Allows the frontend to recompute the hash from delivery_content.text and confirm
    // it matches delivery_content_hash (partial verification: proves displayed content
    // was not altered after delivery, but does not enforce bytes32 at the contract level
    // since deliveryHash is typed as string in the current contract version).
    const deliveryContentHash = keccak256(toHex(text));

    console.log(`[start-job] Gemini response received: ${text.length} chars, model=${geminiModel}, hash=${deliveryContentHash.slice(0, 10)}…`);

    // ── Step 2: submitDelivery() onchain ────────────────────────────────────
    // This MUST succeed before we write 'delivered' to Supabase.
    // If it fails, the catch block reverts Supabase to 'funded' so both layers agree.
    // Pre-flight above already confirmed the onchain slot is deliverable.

    let txHashDelivery: string | undefined;

    if (onchainModeEnabled) {
      const rpcUrl = Deno.env.get('ARC_RPC_URL') || 'https://rpc.testnet.arc.network';

      const arcTestnet = defineChain({
        id: 5042002,
        name: 'Arc Testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      });

      // Accept key with or without 0x prefix.
      const privateKey = (agentPrivateKeyRaw!.startsWith('0x')
        ? agentPrivateKeyRaw
        : `0x${agentPrivateKeyRaw}`) as `0x${string}`;

      const account = privateKeyToAccount(privateKey);
      console.log(`[start-job] submitDelivery caller: ${account.address}`);

      const walletClient = createWalletClient({
        account,
        chain: arcTestnet,
        transport: http(rpcUrl),
      });
      const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(rpcUrl),
      });

      // Pass the keccak256 content hash as the deliveryHash — stronger than the UUID.
      // The contract stores it as string (not bytes32) until next redeploy.
      const txHash = await walletClient.writeContract({
        address: escrowAddress!,
        abi: CONTRACT_ABI,
        functionName: 'submitDelivery',
        args: [BigInt(onchainJobId!), deliveryContentHash],
      });

      console.log(`[start-job] submitDelivery broadcast: ${txHash}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error(
          `submitDelivery reverted onchain. tx=${txHash} block=${receipt.blockNumber}. ` +
          `Check: is AGENT_PRIVATE_KEY authorized (owner or authorizedAgents)?`
        );
      }

      txHashDelivery = txHash;
      console.log(`[start-job] submitDelivery confirmed in block ${receipt.blockNumber}`);
    } else {
      console.log(
        `[start-job] simulation mode — skipping submitDelivery ` +
        `(escrow=${!!escrowAddress} key=${!!agentPrivateKeyRaw} onchainId=${onchainJobId})`
      );
    }

    // ── Step 3: Update Supabase — ONLY after onchain confirmation ──────────
    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        status: 'delivered',
        delivered_at: now,
        tx_hash_delivery: txHashDelivery ?? null,
        delivery_content_hash: deliveryContentHash,
        delivery_content: {
          text,
          generatedAt: now,
          model: geminiModel,
          fileName: `${agentName.replace(/\s+/g, '_')}_output.md`,
          fileSize: `${Math.max(1, Math.ceil(text.length / 1024))} KB • AI Generated`,
          summary: `Completed by ${agentName}`,
        },
      })
      .eq('id', jobId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : String(err);

    // Full error always logged server-side (visible in Supabase Function Logs).
    console.error('[start-job] error:', rawMessage);

    let userFacingError = rawMessage;

    if (rawMessage.startsWith('ONCHAIN_BLOCKED:')) {
      // Format: ONCHAIN_BLOCKED:<StatusLabel>:<human message>
      // The human message is the third segment — show it directly, it's already user-friendly.
      const parts = rawMessage.split(':');
      userFacingError = parts.slice(2).join(':').trim();
    } else if (rawMessage.includes('RESOURCE_EXHAUSTED') && rawMessage.includes('limit: 0')) {
      userFacingError =
        "This AI model isn't currently available on the free tier. Please try again later or contact support.";
    } else if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
      userFacingError = 'The AI model is temporarily rate-limited. Wait a moment and try again.';
    } else if (rawMessage.includes('submitDelivery reverted')) {
      userFacingError =
        'The agent generated a response but the onchain delivery confirmation failed. ' +
        'Your funds are still safe in escrow. Please retry or contact support.';
    }

    // Revert to 'funded' only if still in a retryable state.
    // Never overwrite disputed/released/refunded — those are intentional terminal states.
    if (jobId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await supabase
          .from('jobs')
          .update({
            status: 'funded',
            delivery_content: { error: userFacingError, failedAt: new Date().toISOString() },
          })
          .eq('id', jobId)
          .in('status', ['funded', 'in_progress']);
      } catch (revertErr) {
        console.error('[start-job] failed to revert status:', revertErr);
      }
    }

    return new Response(JSON.stringify({ success: false, error: userFacingError }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
