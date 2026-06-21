import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { ReviewCard } from '../components/ReviewCard';
import { Star, ShieldAlert, CheckCircle2, ShieldCheck, Bolt, ChevronRight, Lock } from 'lucide-react';

export const AgentProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents } = useApp();

  const agent = agents.find(a => a.id === id);

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

  const isEmojiAvatar = !agent.avatarUrl.startsWith('http');

  return (
    <div className="bg-slate-50 min-h-screen pb-32 md:pl-64 text-slate-900">
      <Navbar title={agent.name} showBackButton={true} />

      <main className="mt-20 max-w-[1200px] mx-auto px-4 md:px-8 pt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main content column (Left) */}
          <div className="flex-1 space-y-6">
            
            {/* Profile Hero Header Card */}
            <header className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left select-none relative">
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
                  {isEmojiAvatar ? (
                    <span className="text-6xl">{agent.avatarUrl}</span>
                  ) : (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                {agent.escrowProtected && (
                  <div className="absolute right-1 bottom-1 bg-primary text-white rounded-full p-1.5 border-4 border-white shadow-inner" title="ArcHire Escrow Sealed">
                    <ShieldCheck className="w-5 h-5" fill="currentColor" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                    {agent.name}
                  </h1>
                  <span className="inline-flex self-center items-center bg-blue-50 text-primary border border-blue-100 font-bold px-3 py-1 rounded-full text-[9px] tracking-wide uppercase select-none">
                    Escrow Protected
                  </span>
                </div>
                
                <p className="text-slate-500 font-semibold text-sm leading-relaxed max-w-xl">
                  {agent.title}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  {agent.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Quick specifications stats cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 select-none">
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <p className="text-xl md:text-2xl font-black text-primary font-mono">{agent.id === 'vectormind' ? '1.2k' : agent.jobsCount}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Jobs Completed</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xl md:text-2xl font-black text-primary font-mono">{agent.rating.toFixed(1)}</span>
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                </div>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Rating Score</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <p className="text-xl md:text-2xl font-black text-primary font-mono">{agent.avgDeliveryTime}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Avg Delivery</p>
              </div>
            </div>

            {/* Extended Biography block */}
            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-3">
              <h2 className="text-lg md:text-xl font-black text-slate-900">About this agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
                {agent.longDescription}
              </p>
            </section>

            {/* Client Reviews group */}
            <section className="space-y-4">
              <div className="flex items-center justify-between select-none px-1">
                <h2 className="text-lg md:text-xl font-black text-slate-900">Client Reviews</h2>
                <button
                  onClick={() => alert(`Showing all ${agent.reviewCount} historic customer logs.`)}
                  className="text-primary font-bold text-xs hover:underline cursor-pointer"
                >
                  See all {agent.reviewCount} Waitlist reviews
                </button>
              </div>

              <div className="space-y-4">
                {agent.reviews.map(rev => (
                  <ReviewCard key={rev.id} review={rev} />
                ))}
              </div>
            </section>

          </div>

          {/* Pricing panel side widget (Right sticky) */}
          <aside className="lg:w-80 flex-shrink-0 select-none">
            <div className="sticky top-20 space-y-4">
              
              <div className="bg-white rounded-xl p-6 border-2 border-primary shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-white bg-primary px-2 py-0.5 rounded uppercase tracking-wider">
                    Best Value
                  </span>
                  
                  <div className="flex justify-between items-baseline mt-4 mb-5">
                    <h3 className="font-extrabold text-lg text-slate-800">Standard Task</h3>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">${agent.pricePerTask.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">/ per task execution</p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 mb-6 text-sm text-slate-600 font-semibold border-b border-slate-100 pb-5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>{agent.avgDeliveryTime} avg. delivery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>3 Revisions included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>High-priority execution queue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>API Access Support</span>
                    </li>
                  </ul>
                </div>

                {/* Safe escrow secure disclaimer banner */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-start gap-3 border border-slate-200">
                  <Lock className="w-5 h-5 text-primary mt-0.5" fill="currentColor" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Safe Escrow Protected</h4>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                      Funds are held inside code contract and only released once you confirm output is correct.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/hire/${agent.id}`)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg shadow-md hover:bg-slate-800 active:scale-95 duration-200 cursor-pointer text-sm"
                >
                  Hire this agent
                </button>
              </div>

              {/* Instant Start button banner */}
              <div
                onClick={() => navigate(`/hire/${agent.id}`)}
                className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 hover:border-blue-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <Bolt className="w-5 h-5" fill="currentColor" />
                  </div>
                  <span className="font-bold text-xs text-slate-700">Instant Execution Start</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* Floating Bottom Mobile CTA Bar (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-16 sm:bottom-0 left-0 w-full bg-white/95 p-4 border-t border-slate-250 z-30 flex items-center justify-between gap-4 select-none">
        <div>
          <span className="block text-xl font-black text-primary">${agent.pricePerTask.toFixed(2)}</span>
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Per task execution</span>
        </div>
        <button
          onClick={() => navigate(`/hire/${agent.id}`)}
          className="flex-1 bg-slate-900 text-white font-bold py-3.5 px-6 rounded-lg text-xs active:scale-95 transition-all text-center select-none shadow-md"
        >
          Hire {agent.name}
        </button>
      </div>
    </div>
  );
};
