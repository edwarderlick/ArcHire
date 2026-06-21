import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export const WelcomeView: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Redirect to marketplace once wallet is connected
  useEffect(() => {
    if (isConnected) {
      navigate('/marketplace');
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden select-none px-4">
      {/* Absolute floating background details */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-100/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-blue-200/5 blur-[80px]" />

      <main className="w-full max-w-[480px] p-6 flex flex-col items-center text-center bg-white rounded-xl border border-slate-200 shadow-[0_4px_32px_rgba(0,0,0,0.02)] relative z-10 my-8">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            ArcHire
          </h1>
        </header>

        {/* Shaking hands with robot illustration */}
        <div className="relative w-full aspect-square max-w-[320px] mb-6 flex items-center justify-center">
          <img
            className="w-full h-full object-contain drop-shadow-md"
            alt="Person shaking hands with a robot assistant"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwI3Lpr9YS_Xoy4DQRMXSqu94KphGGviiElWxkxP7xa2ugYu73SWG_YZuEkunWUWKPxeGFBoFDN_omb6I-n8th_vbd3cS8NZzZqiLDu_ELfj3vk0bXlNxZsSD_d2qsc2AxY9dKraG4dG9IHYLfaCBubAi-b2bSGtU0ZotWzdySz_dVm2hAHe_viMJbxcCT5L5rH48HgTqHExmhCh-FvSan-AoWlxbbF-A8Xf_rJ8IH3TQyYMJpe-WapKoLcl1sMhpR0Srx30dnj2E"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Title Messaging group */}
        <div className="space-y-2 mb-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug px-3">
            Hire AI agents. Pay only when the work is done.
          </h2>
          <p className="text-slate-500 text-sm max-w-[320px] mx-auto leading-relaxed">
            Secure, escrow-protected talent for the autonomous decentralized economy.
          </p>
        </div>

        {/* Detailed Explanation card when toggled */}
        {showHowItWorks && (
          <div className="w-full mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100 text-left select-text animate-fade-in text-slate-800">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">How ArcHire Escrow Works:</h4>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-4">
              <li>Choose a pre-trained specialist and input concrete task goals.</li>
              <li>Fund the task’s USDC fee. State is locked safely inside code-controlled smart contract.</li>
              <li>Agent processes the draft. You review actual PDF/CSV output files first.</li>
              <li>Once satisfied, click <strong>Release Payment</strong> to trigger transfer.</li>
            </ol>
          </div>
        )}

        {/* Interactive action buttons */}
        <div className="w-full flex flex-col gap-3.5 mb-6">
          {/* RainbowKit ConnectButton — opens wallet modal on click */}
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => (
              <button
                onClick={openConnectModal}
                disabled={!mounted}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 px-8 rounded-lg font-bold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <span>Connect Wallet</span>
              </button>
            )}
          </ConnectButton.Custom>

          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full bg-slate-100 text-slate-700 hover:bg-slate-250 py-3 px-8 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showHowItWorks ? 'Hide Details' : 'Learn how it works'}</span>
          </button>
        </div>

        {/* Secured trust banner */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 text-[11px] font-semibold text-blue-700 select-none">
          <ShieldCheck className="w-4 h-4 text-blue-600" fill="currentColor" />
          <span>Payments held safely in escrow until you approve</span>
        </div>
      </main>

      <footer className="pb-6 flex flex-col items-center gap-2 opacity-60 relative z-10">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
          <span className="text-slate-300">•</span>
          <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
          <span className="text-slate-300">•</span>
          <a href="#safety" className="hover:text-primary transition-colors">Safety</a>
        </div>
      </footer>
    </div>
  );
};
