import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { JobCard } from '../components/JobCard';
import { Briefcase, AlertCircle, FileSpreadsheet, Lock } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { jobs } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'review' | 'completed'>('all');

  // Filter lists based on selected tabs
  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') return jobs;
    return jobs.filter(job => job.status === activeTab);
  }, [jobs, activeTab]);

  // Dynamically calculate bento statistics metrics
  const activeJobsCount = useMemo(() => {
    return jobs.filter(j => j.status === 'active').length;
  }, [jobs]);

  const escrowBalance = useMemo(() => {
    return jobs
      .filter(j => j.status === 'active' || j.status === 'review')
      .reduce((sum, j) => sum + j.amountUSDC, 0);
  }, [jobs]);

  const completedJobsCount = useMemo(() => {
    return jobs.filter(j => j.status === 'completed').length;
  }, [jobs]);

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans antialiased text-slate-900 md:pl-64">
      <Navbar title="Agency Hub" showBackButton={false} />

      <main className="mt-20 px-4 md:px-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
        
        {/* Title Messaging section */}
        <section className="select-none">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">My Agency Hub</h2>
          <p className="text-slate-500 text-sm mt-1 font-semibold">Manage your active AI agents and track progress.</p>
        </section>

        {/* Tab Selection Row */}
        <section className="relative flex items-center border-b border-slate-200 overflow-x-auto hide-scrollbar select-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`relative px-5 py-3 text-xs md:text-sm font-bold transition-all focus:outline-none flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'all' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>All System Jobs</span>
            {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`relative px-5 py-3 text-xs md:text-sm font-bold transition-all focus:outline-none flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'active' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
            <span>Running</span>
            {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`relative px-5 py-3 text-xs md:text-sm font-bold transition-all focus:outline-none flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'review' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-primary" />
            <span>Awaiting Review</span>
            {activeTab === 'review' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`relative px-5 py-3 text-xs md:text-sm font-bold transition-all focus:outline-none flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'completed' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Completed</span>
            {activeTab === 'completed' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
          </button>
        </section>

        {/* Dashboard statistics Bento grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Running Tasks</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono mt-1 block">{activeJobsCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex items-start justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Locked in Escrow</span>
              <span className="text-xl md:text-2xl font-black text-primary font-mono mt-1 block">${escrowBalance.toFixed(2)}</span>
            </div>
            <Lock className="w-4 h-4 text-primary mt-1" fill="currentColor" />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Success Rate</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono mt-1 block">99.8%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Completed</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono mt-1 block">{completedJobsCount}</span>
          </div>
        </section>

        {/* Dynamic task items list */}
        <section className="space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center bg-white rounded-xl border border-slate-200 p-8 select-none">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No jobs in this category</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
                Hired tasks that enter this specific pipeline state will automatically be tracked on this viewport in real-time.
              </p>
              <Link
                to="/marketplace"
                className="bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-lg hover:bg-slate-800 active:scale-95 shadow-sm"
              >
                Browse Marketplace
              </Link>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
