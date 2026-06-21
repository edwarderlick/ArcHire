import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisconnect } from 'wagmi';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Plus, Building, Lock, ListFilter, ShieldCheck, CornerDownLeft, CreditCard, Coins, LockOpen, LogOut, User } from 'lucide-react';

export const WalletView: React.FC = () => {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { walletAddress, walletBalance, escrowLocked, availableSoon, transactions, addFunds, withdraw } = useApp();

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : '';

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleAddFunds = () => {
    addFunds(0); // shows toast with faucet link
  };

  const handleWithdraw = () => {
    withdraw(0); // shows toast with wallet instructions
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans antialiased text-slate-900 md:pl-64">
      <Navbar title="My Wallet" showBackButton={false} />

      <main className="mt-20 px-4 md:px-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-12">
        
        {/* Connected wallet account */}
        <section className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connected Wallet</p>
              <p className="text-xs font-mono font-bold text-slate-800 select-all">{shortAddress || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </section>

        {/* Balance card panel */}
        <section className="relative overflow-hidden rounded-xl bg-white p-6 border border-slate-200 flex flex-col justify-between select-none">
          {/* Blur ambient color shapes */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Total Balance Details</p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h2 className="text-4xl font-black text-slate-900 font-mono">${walletBalance.toFixed(2)}</h2>
                <span className="text-sm font-bold text-primary font-mono select-all">USDC</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddFunds}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-white rounded-lg py-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Plus className="w-5 h-5 text-white" />
                <span>Get Test USDC (Faucet)</span>
              </button>

              <button
                onClick={handleWithdraw}
                className="flex-1 bg-slate-100 text-slate-700 rounded-lg py-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Building className="w-4 h-4" />
                <span>Withdraw Funds</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bento stats indicators break-downs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
          
          {/* Escrow Locked */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-primary">
              <Lock className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escrow locked balance</p>
              <p className="text-lg font-black text-slate-900 font-mono leading-none mt-1">${escrowLocked.toFixed(2)} USDC</p>
            </div>
          </div>

          {/* Available soon */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-emerald-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Soon</p>
              <p className="text-lg font-black text-slate-900 font-mono leading-none mt-1">${availableSoon.toFixed(2)} USDC</p>
            </div>
          </div>

        </section>

        {/* Transaction log card ledger */}
        <section className="space-y-4">
          <div className="flex items-center justify-between select-none px-1 pt-2">
            <h3 className="font-extrabold text-base md:text-lg text-slate-950">Transaction History</h3>
            <button
              onClick={() => alert('Filter toggles options (Mock UI). Filtered by latest.')}
              className="text-primary font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ListFilter className="w-4 h-4" />
              <span>Filter list Ledger</span>
            </button>
          </div>

          <div className="space-y-3">
            {transactions.map(tx => {
              const isDeposit = !tx.isNegative;
              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 rounded-xl border border-slate-205 hover:border-slate-300 transition-colors flex items-center justify-between select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-slate-200 flex items-center justify-center select-none flex-shrink-0">
                      {tx.avatarUrl ? (
                        <img className="w-full h-full object-cover rounded-lg" src={tx.avatarUrl} alt={tx.description} referrerPolicy="no-referrer" />
                      ) : tx.iconName === 'undo' ? (
                        <CornerDownLeft className="w-5 h-5 text-slate-500" />
                      ) : tx.iconName === 'add_card' ? (
                        <CreditCard className="w-5 h-5 text-primary" />
                      ) : tx.iconName === 'account_balance' ? (
                        <Building className="w-5 h-5 text-slate-500" />
                      ) : (
                        <LockOpen className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">{tx.description}</h4>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>

                  <div className="text-right select-all shrink-0">
                    <p className={`text-sm md:text-base font-bold font-mono ${isDeposit ? 'text-primary' : 'text-rose-600'}`}>
                      {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure footnotes */}
          <div className="pt-8 flex flex-col items-center justify-center opacity-60 text-center select-none">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-450 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" fill="currentColor" />
              <span>Funds secured in multi-signature token vaults</span>
            </div>
            <p className="text-[10px] tracking-widest font-bold text-gray-400 font-mono">
              POWERED BY ARC TESTNET / CIRCLE USDC
            </p>
          </div>

        </section>

      </main>
    </div>
  );
};
