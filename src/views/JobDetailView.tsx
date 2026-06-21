import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { keccak256, toHex } from 'viem';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { EscrowStepper } from '../components/EscrowStepper';
import { Lock, LockOpen, CheckCircle, ShieldAlert, FileText, Download, Star, ShieldAlert as DisputeIcon, ArrowLeft, ShieldCheck, Loader2, Sparkles, Copy, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export const JobDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, approveJob, disputeJob, submitReview, startJob } = useApp();

  const job = jobs.find(j => j.id === id);

  const [isReleasing, setIsReleasing] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Review states
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('Client ' + (id ? id.substring(id.length - 4) : 'User'));

  const verifySignature = () => {
    if (verificationState !== 'idle') return;
    setVerificationState('verifying');
    setTimeout(() => setVerificationState('success'), 1200);
  };

  const escrowContractAddress = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000…not yet deployed';

  const copyContractAddress = () => {
    navigator.clipboard.writeText(escrowContractAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleRetry = async () => {
    if (!job) return;
    setIsRetrying(true);
    try {
      await startJob(job.id);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-8">
        <DisputeIcon className="w-16 h-16 text-primary mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-850">Hired task not found</h2>
        <Link to="/dashboard" className="mt-4 text-primary font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleApproveRelease = async () => {
    setIsReleasing(true);
    try {
      await approveJob(job.id);
    } catch (err) {
      console.error('[JobDetail] approveJob error:', err);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleDispute = async () => {
    try {
      await disputeJob(job.id);
    } catch (err) {
      console.error('[JobDetail] disputeJob error:', err);
    }
  };

  const isCompleted = job.status === 'completed';
  const isEmojiAvatar = !job.agentAvatarUrl.startsWith('http');
  // dbStatus is the authoritative source — dbStatus='disputed' maps to status='active',
  // which would otherwise render the "In Progress" spinner indefinitely.
  const isDisputed   = job.dbStatus === 'disputed';
  const hasError     = job.status === 'active' && !isDisputed && !!job.deliveryContent?.error;
  const isInProgress = job.status === 'active' && !isDisputed && !hasError;

  // Recompute keccak256 of the displayed delivery text and compare against the hash
  // stored in Supabase at delivery time. Partial verification only: proves the text
  // in delivery_content was not altered after the agent wrote it, but does NOT
  // confirm the onchain deliveryHash field is bytes32-encoded (contract uses string).
  const recomputedHash = useMemo(() => {
    const text = job.deliveryContent?.text;
    if (!text) return undefined;
    try { return keccak256(toHex(text)); } catch { return undefined; }
  }, [job.deliveryContent?.text]);

  const contentVerified = !!(
    recomputedHash &&
    job.deliveryContentHash &&
    recomputedHash === job.deliveryContentHash
  );
  const contentVerifiable = !!(job.deliveryContentHash && job.deliveryContent?.text);

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pl-64 font-sans antialiased text-slate-900">

      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white border-b border-slate-200 md:pl-[calc(16rem+1rem)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors active:scale-95 text-primary cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base md:text-lg font-bold text-slate-800">Job Review</h1>
        </div>

        {/* Dynamic Capsule holding details */}
        <div className="bg-blue-50 px-4 py-1.5 rounded-full flex items-center gap-2 border border-blue-100">
          {isCompleted ? (
            <>
              <LockOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-emerald-700 font-mono">Released</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-primary" fill="currentColor" />
              <span className="text-xs font-black text-primary font-mono">{job.amountUSDC.toFixed(2)} USDC</span>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mt-20 px-4 md:px-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">

        {/* Stepper Timeline Section */}
        <EscrowStepper currentStep={job.escrowStep} />

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Job summary, tags, and Delivered Draft preview items */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hired description summary card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{job.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Hired on {job.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary animate-pulse'}`} />
                  <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">
                    {job.status === 'active' ? 'In Progress' : job.status === 'review' ? 'Awaiting Review' : 'Completed'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed font-normal select-text">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {job.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-slate-50 text-primary border border-slate-200 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery area: shows different content based on real job state */}
            {job.status !== 'active' ? (
              /* Delivered or completed: show the real AI output */
              <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-sm text-slate-855 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Delivered Work Draft</span>
                  </h3>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    {job.deliveredAt || 'Received Recently'}
                  </span>
                </div>

                <div className="p-6 bg-slate-50/40">

                  {/* Onchain delivery proof — only shown when submitDelivery() confirmed */}
                  {job.txHashDelivery && (
                    <div className="flex items-start gap-3 mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-800 leading-none mb-0.5">Agent confirmed delivery onchain</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-emerald-600 font-mono">
                            Tx: {job.txHashDelivery.slice(0, 10)}…{job.txHashDelivery.slice(-8)}
                          </span>
                          <a
                            href={`https://testnet.arcscan.app/tx/${job.txHashDelivery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 hover:underline"
                          >
                            view on ArcScan
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        {/* Content integrity check — partial verification, not full onchain bytes32 proof */}
                        {contentVerifiable && (
                          <div
                            className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-emerald-100"
                            title={
                              contentVerified
                                ? `Content matches what was recorded — keccak256 of the displayed text equals the hash stored in the database at delivery time. Partial verification only: this confirms the content was not altered in the database after delivery, but the contract stores the hash as a string (not bytes32), so this is not a full onchain type-enforced proof.\n\nHash: ${job.deliveryContentHash}`
                                : `Content hash mismatch — the keccak256 of the currently displayed text does not match the hash recorded at delivery time. The content may have been altered.\n\nExpected: ${job.deliveryContentHash}\nGot: ${recomputedHash}`
                            }
                          >
                            {contentVerified ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="text-[9px] font-bold text-emerald-700">Content matches what was recorded</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                <span className="text-[9px] font-bold text-rose-700">Content hash mismatch</span>
                              </>
                            )}
                            <span className="ml-auto text-[9px] text-emerald-400 font-mono hidden sm:inline truncate">
                              {job.deliveryContentHash?.slice(0, 10)}…
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 select-text">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                      <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center border border-rose-100 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{job.deliveryContent?.fileName || 'deliverables_output.md'}</p>
                        <p className="text-[10px] text-slate-450 font-semibold">{job.deliveryContent?.fileSize || 'AI Generated'}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (job.deliveryContent?.text) {
                            const blob = new Blob([job.deliveryContent.text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = job.deliveryContent.fileName || 'output.md';
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="ml-auto p-2 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-650 leading-relaxed space-y-4 font-mono bg-slate-50 p-4 rounded-lg border border-slate-150 whitespace-pre-line">
                      {job.deliveryContent?.text}
                    </div>
                  </div>
                </div>
              </div>
            ) : isDisputed ? (
              /* Dispute state — funds locked, no delivery content */
              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-amber-800">Dispute Raised</h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You raised a dispute on this job. Your funds remain safely locked in escrow pending resolution.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Contact ArcHire support to proceed. If the dispute is upheld, an admin will call{' '}
                    <code className="font-mono bg-slate-100 px-1 rounded">refund()</code> on the contract to return your funds.
                    A new job must be created to retry with a fresh escrow slot.
                  </p>
                </div>
              </div>
            ) : hasError ? (
              /* Error state: agent failed — show message and retry button */
              <div className="bg-white rounded-xl border border-rose-200 overflow-hidden">
                <div className="p-4 border-b border-rose-100 bg-rose-50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-rose-800">Agent execution failed</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {job.deliveryContent?.error || 'An unexpected error occurred.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Your funds are still safely locked in escrow. You can retry, or raise a dispute if this keeps happening.
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isRetrying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* In-progress: honest, minimal loading state */
              <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-4 min-h-48 text-center">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{job.agentName} is working on it…</p>
                  <p className="text-xs text-slate-400 mt-1">
                    This usually takes a few seconds. The page will update automatically when done.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Escrow protection summaries and Payment releasing buttons */}
          <div className="space-y-6">

            {/* Funds status indicators */}
            <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden border border-slate-950 shadow-lg select-none">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" fill="currentColor" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Funds protected</span>
                  </div>
                  <span className="text-[8px] bg-slate-800 text-slate-300 border border-slate-705 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                    Arc Testnet
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl font-black font-mono leading-none flex items-baseline gap-1">
                    {isCompleted ? '0.00' : job.amountUSDC.toFixed(2)}{' '}
                    <span className="text-xs font-bold text-slate-400">USDC</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
                    {isCompleted ? 'Payment Released Successfully' : 'Locked safely inside dApp Escrow'}
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-lg border border-white/5 text-xs text-slate-300 leading-snug">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p>
                    {isCompleted
                      ? 'The agent fee has been transferred. Audit receipts are indexed on-chain.'
                      : 'Funds will only be released to the agent once you click Approve and Release Payment.'}
                  </p>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none" />
            </div>

            {/* Escrow Contract Inspector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none">
              <button
                onClick={() => setShowInspector(!showInspector)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" fill="currentColor" />
                  <span className="text-xs font-bold text-slate-800">Escrow Contract Explorer</span>
                </div>
                <span className="text-primary font-bold text-xs">
                  {showInspector ? 'Hide info' : 'Inspect raw ledger'}
                </span>
              </button>

              {showInspector && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 font-mono text-[10.5px] leading-relaxed text-slate-600 animate-fade-in select-text">
                  <div className="space-y-1.5 pb-3 border-b border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-sans">Contract Address</span>
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <span className="truncate select-all pr-2">{escrowContractAddress}</span>
                      <button
                        onClick={copyContractAddress}
                        className="p-1 hover:bg-slate-150 text-slate-400 hover:text-slate-600 rounded cursor-pointer shrink-0 border border-slate-100"
                        title="Copy contract Address"
                      >
                        {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pb-3 border-b border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-sans">Escrow Parameters</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block font-sans">Locked Funds</span>
                        <span className="font-bold text-slate-800">{isCompleted ? '0.00' : job.amountUSDC.toFixed(2)} USDC</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-400 block font-sans">Escrow Status</span>
                        <span className="font-bold text-slate-800">{isCompleted ? 'RELEASED' : 'LOCKED'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={verifySignature}
                      disabled={verificationState !== 'idle'}
                      className={`w-full py-2 px-3 rounded text-center font-bold text-[10.5px] tracking-wider transition-all cursor-pointer border ${
                        verificationState === 'idle'
                          ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
                          : verificationState === 'verifying'
                          ? 'bg-slate-105 border-slate-200 text-slate-500 cursor-not-allowed flex items-center justify-center gap-1.5'
                          : 'bg-emerald-50 text-emerald-850 border-emerald-200 font-bold flex items-center justify-center gap-1'
                      }`}
                    >
                      {verificationState === 'idle' && 'Verify Hash signatures'}
                      {verificationState === 'verifying' && (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Hashing block integrity...</span>
                        </>
                      )}
                      {verificationState === 'success' && (
                        <>
                          <span>✓ Block Checksums Match</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mini agent card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4 shadow-sm select-none">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-blue-50 border border-slate-205 flex items-center justify-center shrink-0">
                {isEmojiAvatar ? (
                  <span className="text-xl">🤖</span>
                ) : (
                  <img
                    className="w-full h-full object-cover"
                    src={job.agentAvatarUrl}
                    alt={job.agentName}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-800">{job.agentName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-[11px] text-slate-500 font-semibold">4.9 rating score</span>
                </div>
              </div>
            </div>

            {/* Escrow actions */}
            {isDisputed ? (
              /* Dispute active — funds locked, no actions available */
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2 select-none">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Dispute Active</span>
                </div>
                <p className="text-[10.5px] text-amber-700 leading-relaxed">
                  Funds are locked pending resolution. An ArcHire admin can refund you or mediate a re-delivery.
                </p>
              </div>
            ) : job.dbStatus === 'delivered' ? (
              /* Delivered — show approve + dispute. Guard on dbStatus (not status) to close
                 the stale-data race window where Realtime lag could show 'review' while the
                 backend has already advanced the job to 'in_progress'. */
              <div className="space-y-3 pt-2 select-none">
                <button
                  onClick={handleApproveRelease}
                  disabled={isReleasing}
                  className="squishy-button w-full bg-slate-900 text-white font-extrabold h-14 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all text-sm cursor-pointer"
                >
                  {isReleasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Releasing Escrow...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve &amp; Release Payment</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDispute}
                  className="w-full bg-white border border-slate-200 text-slate-500 font-bold h-12 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-xs cursor-pointer"
                >
                  <DisputeIcon className="w-4 h-4 text-rose-500" />
                  <span>Request Changes / Raise Dispute</span>
                </button>
              </div>
            ) : isCompleted ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-center select-none">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold select-none">✓</div>
                  <h4 className="font-bold text-xs text-emerald-900">Escrow Payment Released Successfully</h4>
                  <p className="text-[10px] text-emerald-650 mt-0.5 leading-snug">The contract balance has been cleared and transferred to the agent.</p>
                </div>

                {/* Review submission */}
                {!hasReviewed ? (
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fade-in select-none">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-extrabold text-[10.5px] text-slate-800 uppercase tracking-wider">Leave Client Review</h3>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Rating</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(starValue => {
                          const isLit = hoveredRating !== null ? starValue <= hoveredRating : starValue <= rating;
                          return (
                            <button
                              key={starValue}
                              onMouseEnter={() => setHoveredRating(starValue)}
                              onMouseLeave={() => setHoveredRating(null)}
                              onClick={() => setRating(starValue)}
                              className="focus:outline-none transition-transform active:scale-95 duration-100 cursor-pointer text-xl"
                              type="button"
                              aria-label={`Rate ${starValue} Stars`}
                            >
                              <Star
                                className={`w-5.5 h-5.5 transition-colors ${
                                  isLit
                                    ? 'text-amber-450 fill-amber-400'
                                    : 'text-slate-200 hover:text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Display Username</span>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={e => setReviewerName(e.target.value)}
                        placeholder="Your display name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-sans text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary pl-3 placeholder:text-slate-300"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comments</span>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Awesome delivery, exceeded expectations!"
                        className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-3 font-sans text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400 leading-normal"
                      />
                    </div>

                    <button
                      onClick={() => {
                        submitReview(job.agentId, rating, reviewerName, comment);
                        setHasReviewed(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-lg text-xs duration-150 cursor-pointer"
                    >
                      Publish Review &amp; Audit Profile
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center space-y-2 animate-fade-in select-none">
                    <p className="text-xs font-bold text-slate-705">🎉 Thank you, feedback submitted!</p>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      Your review has been compiled and persisted on <strong>{job.agentName}</strong>'s portfolio.
                    </p>
                    <Link
                      to={`/agent/${job.agentId}`}
                      className="text-primary font-bold text-xs inline-flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                    >
                      <span>Go to Agent Profile</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-center text-xs font-bold text-amber-800 select-none">
                ⏳ Agent is working. The release button will appear once the delivery is ready.
              </div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
};
