import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseEventLogs } from 'viem';
import { Agent, Job, Transaction } from '../types';
import { mockAgents, mockJobs, mockTransactions } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { wagmiConfig } from '../config/wagmi';
import { ERC20_ABI } from '../config/usdcAbi';
import { ESCROW_ABI } from '../config/escrowAbi';
import { ToastContainer, ToastMessage } from '../components/Toast';

// ─── Env references (never hardcode addresses) ─────────────────────────────
const USDC_ADDRESS = (import.meta.env.VITE_USDC_CONTRACT_ADDRESS || '') as `0x${string}`;
const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '') as `0x${string}`;
const AGENT_DEFAULT_WALLET = (import.meta.env.VITE_AGENT_DEFAULT_WALLET || '') as `0x${string}`;

// ─── DB → App mappers ───────────────────────────────────────────────────────

function mapDbStatusToUiStatus(dbStatus: string): Job['status'] {
  if (dbStatus === 'delivered') return 'review';
  if (dbStatus === 'released' || dbStatus === 'refunded') return 'completed';
  return 'active'; // funded, in_progress, created, disputed
}

function mapDbStatusToEscrowStep(dbStatus: string): Job['escrowStep'] {
  switch (dbStatus) {
    case 'created': return 'created';
    case 'funded': return 'funded';
    case 'in_progress': return 'progress';
    case 'delivered': return 'delivered';
    case 'released':
    case 'refunded': return 'released';
    default: return 'funded';
  }
}

function mapAgentFromDb(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url || '🤖',
    category: row.category,
    title: row.tagline || '',
    description: row.description || '',
    longDescription: row.long_description || '',
    pricePerTask: parseFloat(row.price_usdc) || 0,
    rating: parseFloat(row.rating) || 5.0,
    reviewCount: row.review_count || 0,
    escrowProtected: row.escrow_protected !== false,
    tags: row.tags || [],
    jobsCount: row.jobs_count || 0,
    avgDeliveryTime: row.avg_delivery_time || '15m',
    reviews: (row.reviews || []).map((r: any) => ({
      id: r.id,
      agentId: r.agent_id,
      reviewerName: r.reviewer_name || 'Anonymous',
      rating: r.rating,
      comment: r.comment || '',
      timeAgo: formatTimeAgo(r.created_at),
    })),
    ownerWallet: row.owner_wallet || undefined,
  };
}

function mapJobFromDb(row: any): Job {
  const agent = row.agents || {};
  const dbStatus = row.status as string;
  return {
    id: row.id,
    agentId: row.agent_id,
    agentName: agent.name || 'Unknown Agent',
    agentAvatarUrl: agent.avatar_url || '🤖',
    title: row.title || `${agent.name || 'Agent'} Task`,
    status: mapDbStatusToUiStatus(dbStatus),
    dbStatus: dbStatus as Job['dbStatus'],
    amountUSDC: parseFloat(row.amount_usdc) || 0,
    createdAt: formatDate(row.created_at),
    deliveredAt: row.delivered_at ? `Received ${formatTimeAgo(row.delivered_at)}` : undefined,
    completedAt: row.completed_at ? formatDate(row.completed_at) : undefined,
    description: row.description || '',
    deliveryContent: row.delivery_content || undefined,
    escrowStep: mapDbStatusToEscrowStep(dbStatus),
    tags: row.tags || agent.tags || [],
    onchainJobId: row.onchain_job_id || undefined,
    txHashFund: row.tx_hash_fund || undefined,
    txHashRelease: row.tx_hash_release || undefined,
    txHashDelivery: row.tx_hash_delivery || undefined,
    deliveryContentHash: row.delivery_content_hash || undefined,
  };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeAgo(iso: string): string {
  if (!iso) return 'recently';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatTxDate(): string {
  return `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Context shape (same public interface as before) ────────────────────────

interface AppContextType {
  walletAddress?: string;
  isConnected: boolean;
  walletBalance: number;
  escrowLocked: number;
  availableSoon: number;
  agents: Agent[];
  jobs: Job[];
  transactions: Transaction[];
  hireAgent: (agentId: string, taskDescription: string, amountUSDC: number) => Promise<string>;
  startJob: (jobId: string) => Promise<{ success: boolean; error?: string }>;
  approveJob: (jobId: string) => Promise<void>;
  disputeJob: (jobId: string) => Promise<void>;
  addFunds: (amount: number) => void;
  withdraw: (amount: number) => void;
  submitReview: (agentId: string, rating: number, reviewerName: string, comment: string) => Promise<void>;
  resetAll: () => void;
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: walletAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── USDC decimals (read once) ──────────────────────────────────────────────
  const { data: usdcDecimalsRaw } = useReadContract({
    address: USDC_ADDRESS || undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!USDC_ADDRESS },
  });
  const usdcDecimals = Number(usdcDecimalsRaw ?? 6);

  // ── USDC balance (refetch on wallet change) ────────────────────────────────
  const { data: usdcBalanceRaw, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS || undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletAddress ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!walletAddress && !!USDC_ADDRESS },
  });
  const walletBalance =
    usdcBalanceRaw !== undefined
      ? Number(usdcBalanceRaw) / Math.pow(10, usdcDecimals)
      : 0;

  // ── Agents from Supabase (public read, fall back to mockAgents) ────────────
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('agents')
      .select('*, reviews(*)')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[ArcHire] agents fetch error:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setAgents(data.map(mapAgentFromDb));
        }
      });
  }, []);

  // ── Jobs from Supabase with Realtime (scoped to connected wallet) ──────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !walletAddress) {
      setJobs([]);
      return;
    }

    const lowerWallet = walletAddress.toLowerCase();

    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, agents(name, avatar_url, tags)')
        .eq('buyer_wallet', lowerWallet)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[ArcHire] jobs fetch error:', error.message);
        return;
      }
      if (data) setJobs(data.map(mapJobFromDb));
    };

    fetchJobs();

    // Realtime subscription
    if (jobChannelRef.current) {
      supabase.removeChannel(jobChannelRef.current);
    }
    const channel = supabase
      .channel(`jobs:buyer:${lowerWallet}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `buyer_wallet=eq.${lowerWallet}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(j => j.id !== (payload.old as any).id));
            return;
          }
          // INSERT or UPDATE: re-fetch with join for agent data
          const { data } = await supabase
            .from('jobs')
            .select('*, agents(name, avatar_url, tags)')
            .eq('id', (payload.new as any).id)
            .single();
          if (data) {
            const mapped = mapJobFromDb(data);
            setJobs(prev => {
              const idx = prev.findIndex(j => j.id === mapped.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = mapped;
                return next;
              }
              return [mapped, ...prev];
            });
          }
        }
      )
      .subscribe();

    jobChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      jobChannelRef.current = null;
    };
  }, [walletAddress]);

  // ── Derived financials ─────────────────────────────────────────────────────
  const escrowLocked = jobs
    .filter(j => j.status === 'active' || j.status === 'review')
    .reduce((sum, j) => sum + j.amountUSDC, 0);

  const availableSoon = 0; // future: pending releases

  // ── Transactions derived from jobs ────────────────────────────────────────
  const transactions: Transaction[] = jobs.map(job => ({
    id: job.id,
    description:
      job.status === 'completed'
        ? `Released Payment to ${job.agentName}`
        : `Fund Escrow for ${job.agentName}`,
    amount: job.amountUSDC,
    isNegative: true,
    date: job.createdAt,
    status: job.status === 'completed' ? 'COMPLETED' : 'PENDING',
    type: 'PAYMENT',
    avatarUrl: job.agentAvatarUrl.startsWith('http') ? job.agentAvatarUrl : undefined,
    iconName: job.agentAvatarUrl.startsWith('http') ? undefined : 'lock',
  }));

  // ─────────────────────────────────────────────────────────────────────────
  // hireAgent: approve USDC → createJob onchain → insert to Supabase
  // Falls back to mock simulation when contract or Supabase is not configured.
  // ─────────────────────────────────────────────────────────────────────────
  const hireAgent = useCallback(async (
    agentId: string,
    taskDescription: string,
    amountUSDC: number
  ): Promise<string> => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      showToast('Agent not found.', 'error');
      return '';
    }

    // ── Fallback: no contract or Supabase → simulate locally ──────────────
    if (!ESCROW_ADDRESS || !isSupabaseConfigured || !walletAddress) {
      if (!walletAddress) {
        showToast('Please connect your wallet to hire an agent.', 'error');
        return '';
      }
      // Local simulation (keeps demo working without full setup)
      const newJobId = `job-${Date.now()}`;
      const newJob: Job = {
        id: newJobId,
        agentId: agent.id,
        agentName: agent.name,
        agentAvatarUrl: agent.avatarUrl,
        title: `${agent.name} Task`,
        status: 'active',
        amountUSDC,
        createdAt: formatDate(new Date().toISOString()),
        description: taskDescription,
        escrowStep: 'funded',
        tags: agent.tags,
      };
      setJobs(prev => [newJob, ...prev]);
      showToast('Job created (simulation — configure .env.local for real escrow).', 'info');
      // Simulate delivery after 20s
      setTimeout(() => {
        setJobs(prev =>
          prev.map(j =>
            j.id === newJobId
              ? {
                  ...j,
                  status: 'review' as const,
                  escrowStep: 'delivered' as const,
                  deliveredAt: 'Received Just Now',
                  deliveryContent: {
                    fileName: `${agent.name}_output.zip`,
                    fileSize: '1.8 MB • Fast Draft',
                    summary: 'Completed execution draft',
                    text: `Hello, I have processed your instruction:\n"${taskDescription}"\n\nPlease review and approve payment to release the escrow funds.`,
                  },
                }
              : j
          )
        );
      }, 20000);
      return newJobId;
    }

    // ── Real onchain flow ──────────────────────────────────────────────────
    const agentWallet = (agent.ownerWallet || AGENT_DEFAULT_WALLET) as `0x${string}`;
    if (!agentWallet || agentWallet === '0x') {
      showToast(
        'Agent payout wallet not configured. Set VITE_AGENT_DEFAULT_WALLET in .env.local or update owner_wallet in Supabase.',
        'error'
      );
      return '';
    }

    try {
      // Use hook-cached decimals (read once at mount from the USDC contract)
      const amountRaw = BigInt(Math.round(amountUSDC * Math.pow(10, usdcDecimals)));

      // Step 1: Approve USDC spend
      // wagmi v2 infers chain/account from the connected wallet — cast to any to bypass
      // its complex generic overloads while preserving runtime correctness.
      showToast('Step 1/2: Approve USDC in your wallet…', 'info');
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ESCROW_ADDRESS, amountRaw],
      } as any);
      await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });

      // Step 2: Create job on contract
      showToast('Step 2/2: Funding escrow on Arc…', 'info');
      const createHash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'createJob',
        args: [agentWallet, amountRaw],
      } as any);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: createHash });

      // Parse onchain jobId from JobCreated event logs
      let onchainJobId: string | undefined;
      try {
        const parsed = parseEventLogs({
          abi: ESCROW_ABI,
          eventName: 'JobCreated',
          logs: receipt.logs as any,
        });
        onchainJobId = parsed[0]?.args?.jobId?.toString();
      } catch {
        // non-fatal: onchainJobId stays undefined, tx hash is still stored
      }

      // Insert to Supabase
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          buyer_wallet: walletAddress.toLowerCase(),
          agent_id: agentId,
          title: `${agent.name} Task`,
          description: taskDescription,
          status: 'funded',
          amount_usdc: amountUSDC,
          onchain_job_id: onchainJobId ?? null,
          tx_hash_fund: createHash,
          tags: agent.tags,
        })
        .select()
        .single();

      if (error) throw error;

      showToast(`Job created! ${agent.name} is now working on your task.`, 'success');
      refetchBalance();
      return data.id as string;
    } catch (err: any) {
      console.error('[ArcHire] hireAgent error:', err);
      const msg =
        err?.shortMessage ||
        err?.message ||
        'Transaction failed. Check your wallet and try again.';
      showToast(msg, 'error');
      return '';
    }
  }, [agents, walletAddress, writeContractAsync, showToast, refetchBalance]);

  // ─────────────────────────────────────────────────────────────────────────
  // startJob: calls the start-job Edge Function to run Gemini on the task.
  // Called by the frontend immediately after the escrow funding tx confirms.
  // Not a DB trigger — the frontend is explicitly responsible for calling this.
  // ─────────────────────────────────────────────────────────────────────────
  const startJob = useCallback(async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      // Simulation mode: fake a short delay then mark delivered locally
      await new Promise(r => setTimeout(r, 3000));
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? {
                ...j,
                status: 'review' as const,
                escrowStep: 'delivered' as const,
                deliveredAt: 'Received Just Now',
                deliveryContent: {
                  fileName: 'output.md',
                  fileSize: '1 KB • Simulated',
                  summary: 'Simulated delivery',
                  text: `This is a simulated response. Wire up Supabase + GEMINI_API_KEY to get a real AI response.\n\nYour task: ${prev.find(j => j.id === jobId)?.description ?? ''}`,
                },
              }
            : j
        )
      );
      return { success: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('start-job', {
        body: { jobId },
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error ?? 'start-job returned failure');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message ?? 'Agent execution failed';
      console.error('[ArcHire] startJob error:', msg);
      return { success: false, error: msg };
    }
  }, [isSupabaseConfigured]);

  // ─────────────────────────────────────────────────────────────────────────
  // approveJob: approveAndRelease onchain → update Supabase status to 'released'
  // ─────────────────────────────────────────────────────────────────────────
  const approveJob = useCallback(async (jobId: string): Promise<void> => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === 'completed') return;

    // Fallback: no contract → simulate locally
    if (!ESCROW_ADDRESS || !isSupabaseConfigured || job.onchainJobId === undefined) {
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? { ...j, status: 'completed' as const, escrowStep: 'released' as const, completedAt: formatDate(new Date().toISOString()) }
            : j
        )
      );
      showToast('Payment released (simulation).', 'success');
      return;
    }

    try {
      showToast('Releasing escrow funds on Arc…', 'info');
      const releaseHash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'approveAndRelease',
        args: [BigInt(job.onchainJobId)],
      } as any);
      await waitForTransactionReceipt(wagmiConfig, { hash: releaseHash });

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'released', tx_hash_release: releaseHash, completed_at: now })
        .eq('id', jobId);
      if (error) console.error('[ArcHire] approveJob Supabase update error:', error.message);

      showToast('Payment released successfully!', 'success');
      refetchBalance();
    } catch (err: any) {
      console.error('[ArcHire] approveJob error:', err);
      showToast(err?.shortMessage || err?.message || 'Release failed.', 'error');
    }
  }, [jobs, writeContractAsync, showToast, refetchBalance]);

  // ─────────────────────────────────────────────────────────────────────────
  // disputeJob: call dispute() onchain → update Supabase status to 'disputed'
  // ─────────────────────────────────────────────────────────────────────────
  const disputeJob = useCallback(async (jobId: string): Promise<void> => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Fallback
    if (!ESCROW_ADDRESS || !isSupabaseConfigured || job.onchainJobId === undefined) {
      showToast('Dispute raised. ArcHire mediators will review. Funds remain locked.', 'info');
      return;
    }

    try {
      showToast('Submitting dispute on Arc…', 'info');
      const disputeHash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'dispute',
        args: [BigInt(job.onchainJobId)],
      } as any);
      await waitForTransactionReceipt(wagmiConfig, { hash: disputeHash });

      const { error } = await supabase
        .from('jobs')
        .update({ status: 'disputed' })
        .eq('id', jobId);
      if (error) console.error('[ArcHire] disputeJob Supabase update error:', error.message);

      showToast('Dispute submitted. Funds are locked pending review.', 'success');
    } catch (err: any) {
      console.error('[ArcHire] disputeJob error:', err);
      showToast(err?.shortMessage || err?.message || 'Dispute failed.', 'error');
    }
  }, [jobs, writeContractAsync, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // addFunds / withdraw — wallet operations, UI is kept as-is
  // ─────────────────────────────────────────────────────────────────────────
  const addFunds = useCallback((_amount: number) => {
    showToast('Fund your wallet via the Arc Testnet faucet: https://faucet.circle.com', 'info');
  }, [showToast]);

  const withdraw = useCallback((_amount: number) => {
    showToast('To send USDC to an external address, use your wallet app (MetaMask, etc.) directly.', 'info');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // submitReview: insert review → update agent rating in Supabase
  // ─────────────────────────────────────────────────────────────────────────
  const submitReview = useCallback(async (
    agentId: string,
    rating: number,
    reviewerName: string,
    comment: string
  ): Promise<void> => {
    const job = jobs.find(j => j.agentId === agentId && j.status === 'completed');

    if (isSupabaseConfigured && job) {
      try {
        await supabase.from('reviews').insert({
          job_id: job.id,
          agent_id: agentId,
          reviewer_wallet: walletAddress?.toLowerCase() ?? 'anonymous',
          reviewer_name: reviewerName.trim() || 'Anonymous Client',
          rating,
          comment: comment.trim() || '',
        });

        // Recalculate and update agent rating
        const { data: allReviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('agent_id', agentId);
        if (allReviews && allReviews.length > 0) {
          const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
          await supabase
            .from('agents')
            .update({ rating: parseFloat(avg.toFixed(1)), review_count: allReviews.length })
            .eq('id', agentId);
        }
      } catch (err) {
        console.error('[ArcHire] submitReview error:', err);
      }
    }

    // Always update local state immediately for responsive UI
    setAgents(prev =>
      prev.map(agent => {
        if (agent.id !== agentId) return agent;
        const newReview = {
          id: `rev-${Date.now()}`,
          agentId,
          reviewerName: reviewerName.trim() || 'Anonymous Client',
          rating,
          comment: comment.trim() || 'No comment provided.',
          timeAgo: 'Just now',
        };
        const updated = [newReview, ...agent.reviews];
        const avg = parseFloat((updated.reduce((s, r) => s + r.rating, 0) / updated.length).toFixed(1));
        return { ...agent, reviews: updated, reviewCount: updated.length, rating: avg };
      })
    );
  }, [jobs, walletAddress]);

  // ─────────────────────────────────────────────────────────────────────────
  // resetAll — clears local state; Supabase data persists (by design)
  // ─────────────────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setAgents(mockAgents);
    setJobs([]);
    localStorage.clear();
    showToast('Demo data reset. Disconnect and reconnect your wallet to reload.', 'info');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        walletAddress: walletAddress ?? undefined,
        isConnected,
        walletBalance,
        escrowLocked,
        availableSoon,
        agents,
        jobs,
        transactions,
        hireAgent,
        startJob,
        approveJob,
        disputeJob,
        addFunds,
        withdraw,
        submitReview,
        resetAll,
        showToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={dismissToast} />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
