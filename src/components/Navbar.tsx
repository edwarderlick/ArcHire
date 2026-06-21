import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDisconnect } from 'wagmi';
import { useApp } from '../context/AppContext';
import { Store, ShieldCheck, Wallet, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'ArcHire', showBackButton = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletAddress, walletBalance, resetAll } = useApp();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleReset = () => {
    if (window.confirm('Would you like to reset all mock metrics and local job logs to initial demo values?')) {
      resetAll();
      navigate('/');
    }
  };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : '';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar Navigation - Desktop only */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed left-0 top-0 h-full z-40 select-none">
        <div className="flex items-center justify-center px-6 py-4 border-b border-slate-900 bg-[#0d1526]">
          <img src="/archire-logo.png" alt="ArcHire" className="h-14 object-contain" />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/marketplace"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${
              isActive('/marketplace') ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" />
            Marketplace
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${
              isActive('/dashboard') ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Active Jobs
          </Link>
          <Link
            to="/wallet"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${
              isActive('/wallet') ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            My Wallet
          </Link>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50 space-y-2">
          {shortAddress && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-600 truncate select-all">
                {shortAddress}
              </span>
            </div>
          )}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-white text-xs font-bold text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 hover:bg-rose-50/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="truncate">Disconnect Wallet</span>
          </button>
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-white text-xs font-bold text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 hover:bg-red-50/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="truncate">Reset Demo Data</span>
          </button>
        </div>
      </aside>

      {/* Top AppBar */}
      <header className="fixed top-0 left-0 w-full md:pl-64 z-30 flex justify-between items-center px-4 md:px-8 h-16 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 md:gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-primary hover:bg-slate-100 rounded-full transition-transform active:scale-95 duration-200"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link to="/marketplace" className="md:hidden flex items-center select-none">
            <div className="bg-[#0d1526] rounded-lg px-2 py-1">
              <img src="/archire-logo.png" alt="ArcHire" className="h-8 object-contain" />
            </div>
          </Link>
          {title && title !== 'ArcHire' && (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">/</span>
              <h1 className="text-sm md:text-base font-bold text-slate-800">{title}</h1>
            </div>
          )}
        </div>

        {/* Balance view pill */}
        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 transition-colors select-none"
          >
            <Wallet className="w-4 h-4 text-primary" />
            <span>{walletBalance.toFixed(2)} USDC</span>
          </Link>
        </div>
      </header>

      {/* Mobile Sticky Bottom Tab Bar (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200 rounded-t-2xl flex justify-around items-center py-2 px-1 pb-safe-bottom">
        <Link
          to="/marketplace"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive('/marketplace') ? 'text-primary scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold font-mono tracking-tight">Market</span>
        </Link>

        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive('/dashboard') ? 'text-primary scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold font-mono tracking-tight">Jobs</span>
        </Link>

        <Link
          to="/wallet"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isActive('/wallet') ? 'text-primary scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold font-mono tracking-tight">Wallet</span>
        </Link>

        <button
          onClick={handleReset}
          className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <RefreshCw className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold font-mono tracking-tight">Reset</span>
        </button>
      </nav>
    </>
  );
};
