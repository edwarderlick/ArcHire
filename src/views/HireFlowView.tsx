import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Check, ShieldAlert, Paperclip, Mic, ShieldCheck, ArrowRight, Lock, Wallet, Sparkles, Loader2, Play, AlertCircle, RefreshCw } from 'lucide-react';

export const HireFlowView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, walletBalance, hireAgent, startJob } = useApp();

  const agent = agents.find(a => a.id === id);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [taskDetails, setTaskDetails] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [newJobId, setNewJobId] = useState('');
  const [agentWorking, setAgentWorking] = useState(false);
  const [agentError, setAgentError] = useState('');

  if (!agent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-8">
        <ShieldAlert className="w-16 h-16 text-primary mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-850">Agent profile not found</h2>
        <Link to="/marketplace" className="mt-4 text-primary font-bold hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (taskDetails.trim() === '') {
        alert('Please fill in some specifications describing what needs to be done.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleConfirmAuthorize = async () => {
    setIsFunding(true);
    try {
      const createdId = await hireAgent(agent.id, taskDetails, agent.pricePerTask);
      if (!createdId) return; // hireAgent already showed an error toast
      setNewJobId(createdId);
      setStep(4);

      // Immediately call the edge function — the agent starts working right after escrow confirms.
      // This is NOT a DB trigger; the frontend is responsible for calling it.
      setAgentWorking(true);
      setAgentError('');
      const result = await startJob(createdId);
      if (!result.success) {
        setAgentError(result.error ?? 'Agent execution failed. You can retry from the job page.');
      }
    } catch (err) {
      console.error('[HireFlow] unexpected error:', err);
    } finally {
      setIsFunding(false);
      setAgentWorking(false);
    }
  };

  const handleRetryStartJob = async () => {
    if (!newJobId) return;
    setAgentError('');
    setAgentWorking(true);
    try {
      const result = await startJob(newJobId);
      if (!result.success) {
        setAgentError(result.error ?? 'Agent execution failed again. Check your Gemini API key and try once more.');
      }
    } finally {
      setAgentWorking(false);
    }
  };

  const isEmojiAvatar = !agent.avatarUrl.startsWith('http');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">

      {/* AppBar Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white border-b border-slate-200 select-none">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors active:scale-95 duration-200 border border-slate-200 cursor-pointer"
          aria-label="Cancel and Close"
        >
          <span className="font-extrabold text-xs text-slate-400 font-mono">X</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm md:text-base font-bold text-slate-800">Hire {agent.name}</h1>
        </div>
        <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span>{walletBalance.toFixed(2)} USDC</span>
        </div>
      </header>

      {/* Central Stepper dots UI */}
      <div className="mt-16 pt-6 pb-2 px-4 select-none">
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -z-10 -translate-y-1/2" />

          {/* Describe */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                step > 1 ? 'bg-primary text-white border-primary' : 'bg-primary text-white border-primary'
              }`}
            >
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary mt-1.5">Describe</span>
          </div>

          {/* Review */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                step > 2
                  ? 'bg-primary text-white border-primary'
                  : step === 2
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-200 text-slate-400 border-slate-300'
              }`}
            >
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}>
              Review
            </span>
          </div>

          {/* Escrow */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                step === 3
                  ? 'bg-primary text-white border-primary shadow-md'
                  : step > 3
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-200 text-slate-400 border-slate-300'
              }`}
            >
              {step > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${step >= 3 ? 'text-primary' : 'text-slate-400'}`}>
              Escrow
            </span>
          </div>
        </div>
      </div>

      {/* Main layout container content block */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 flex flex-col items-center">
        <div className="w-full max-w-xl">

          {/* step 1: Describe the specifications of the task */}
          {step === 1 && (
            <section className="space-y-4 animate-fade-in py-2">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-3xl shadow-inner select-none flex-shrink-0 border border-slate-200">
                  {isEmojiAvatar ? (
                    <span>{agent.avatarUrl}</span>
                  ) : (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-none">Describe the task</h2>
                  <p className="text-slate-400 text-xs mt-1">Tell your agent exactly what needs to be done.</p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={taskDetails}
                  onChange={e => setTaskDetails(e.target.value)}
                  className="w-full h-44 bg-white border border-slate-200 rounded-xl p-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                  placeholder="I need help organizing my project timeline milestones, creating a summary of the latest trends, formatting data tables..."
                />
                <div className="absolute bottom-4 right-4 flex gap-1.5 select-none">
                  <button
                    onClick={() => setTaskDetails(prev => prev + ' [Attached File: dataset_export.csv]')}
                    className="p-2 rounded-lg bg-white hover:bg-slate-150 transition-colors active:scale-95 border border-slate-250 cursor-pointer"
                    title="Simulate adding details list file spreadsheet"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => setTaskDetails('I need a professional summarizing draft summarizing the top AI trends of late 2026 for mid-market SaaS.')}
                    className="p-2 rounded-lg bg-white hover:bg-slate-150 transition-colors active:scale-95 border border-slate-250 cursor-pointer"
                    title="Insert voice recognition template"
                  >
                    <Mic className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full h-14 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 mt-6 cursor-pointer text-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          )}

          {/* step 2: Review parameter configurations */}
          {step === 2 && (
            <section className="space-y-6 animate-fade-in py-2">
              <h2 className="text-xl font-black text-slate-800 select-none">Review Details</h2>

              {/* Detailed smart description layout card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1.5">Task Description:</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic select-all">
                  &ldquo;{taskDetails}&rdquo;
                </p>
              </div>

              {/* Secure escrow protecting information block */}
              <div className="bg-white rounded-xl p-5 space-y-4 border border-slate-200 select-none shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-primary">
                    <Lock className="w-5 h-5 text-primary" fill="currentColor" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-slate-800">Escrow Protected smart funds</h3>
                    <p className="text-xs text-slate-550 leading-relaxed">
                      Your <span className="font-bold text-slate-700">${agent.pricePerTask.toFixed(2)} USDC</span> will be held safely in our secure escrow smart contract throughout the operation.
                    </p>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs italic text-slate-500">
                  &ldquo;The agent only gets paid once you approve the delivered work. You maintain complete control of releasing funds.&rdquo;
                </div>
              </div>

              {/* Estimate timing statistics columns */}
              <div className="grid grid-cols-2 gap-4 select-none">
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Delivery</span>
                  <p className="font-black text-lg text-slate-800 mt-1 font-mono">~{agent.avgDeliveryTime}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Agent Escrow Fee</span>
                  <p className="font-black text-lg text-primary mt-1 font-mono">{agent.pricePerTask.toFixed(2)} USDC</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 select-none">
                <button
                  onClick={handleNextStep}
                  className="w-full h-14 rounded-lg bg-slate-900 text-white font-extrabold hover:bg-slate-800 flex items-center justify-center text-sm cursor-pointer"
                >
                  Confirm &amp; Proceed
                </button>
                <button
                  onClick={handleBackStep}
                  className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-550 font-bold text-xs transition-colors cursor-pointer"
                >
                  Back to Edit specs
                </button>
              </div>
            </section>
          )}

          {/* step 3: Secure wallet checkout auth */}
          {step === 3 && (
            <section className="space-y-6 animate-fade-in py-2 select-none">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black text-slate-800">Final Step</h2>
                <p className="text-xs text-slate-500">Authorize the escrow payment from your balance dApp.</p>
              </div>

              {/* Inner details invoice summary card */}
              <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden border border-slate-950">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />

                <div className="text-center space-y-1 relative z-10 pt-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block font-mono">My Wallet Balance</span>
                  <h3 className="text-3xl font-black text-white font-mono">{walletBalance.toFixed(2)} USDC</h3>
                </div>

                <div className="h-px bg-slate-800 w-full relative z-10" />

                <div className="flex justify-between items-center text-sm font-semibold relative z-10">
                  <span className="text-slate-400">Escrow Transaction Fee</span>
                  <span className="text-slate-100 font-bold font-mono">{agent.pricePerTask.toFixed(2)} USDC</span>
                </div>

                <button
                  onClick={handleConfirmAuthorize}
                  disabled={isFunding}
                  className="w-full h-16 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center gap-3 shadow-lg cursor-pointer text-sm hover:bg-blue-500"
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sealing Escrow Contract...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-white" fill="currentColor" />
                      <span>Confirm &amp; Fund Escrow</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
                <ShieldCheck className="w-4 h-4 text-primary" fill="currentColor" />
                <span>Secured by ArcHire Escrow Protocol</span>
              </div>
            </section>
          )}

          {/* step 4: Escrow confirmed, agent is working */}
          {step === 4 && (
            <section className="space-y-8 animate-fade-in py-6 text-center select-none">
              <div className="relative inline-block mt-4 mx-auto">
                <div className="w-24 h-24 rounded-full bg-blue-50 border border-blue-105 flex items-center justify-center">
                  <ShieldCheck className="w-12 h-12 text-primary" fill="currentColor" />
                </div>
                <div className="absolute top-[-8px] right-[-8px] text-3xl">🎉</div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-primary leading-tight">Escrow Confirmed!</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your payment is locked. <strong>{agent.name}</strong> is working on your task now.
                </p>
              </div>

              {/* Honest agent status — no fake timers or fabricated progress */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm mx-auto text-left">
                {agentError ? (
                  /* Error state: clear message and retry option */
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Agent returned an error</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{agentError}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRetryStartJob}
                      disabled={agentWorking}
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {agentWorking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>{agentWorking ? 'Retrying...' : 'Retry'}</span>
                    </button>
                  </div>
                ) : agentWorking ? (
                  /* Loading state: spinner while Gemini is generating */
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{agent.name} is working on it…</p>
                      <p className="text-xs text-slate-400 mt-0.5">Usually takes a few seconds</p>
                    </div>
                  </div>
                ) : (
                  /* Success state: Realtime subscription picks up status change */
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Delivery ready for review!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Head to your dashboard to approve or dispute.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-14 rounded-lg border-2 border-primary text-primary font-bold hover:bg-slate-100 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-primary font-bold" fill="currentColor" />
                  <span>Go to Jobs Dashboard</span>
                </button>
              </div>
            </section>
          )}

        </div>
      </div>

      {step < 4 && (
        <footer className="py-4 text-center select-none text-[10px] text-slate-405 font-bold uppercase tracking-widest border-t border-slate-200 bg-white">
          Hiring under code-secured escrow protection
        </footer>
      )}
    </div>
  );
};
