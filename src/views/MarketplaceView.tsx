import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { AgentCard } from '../components/AgentCard';
import { Search, Sparkles, SlidersHorizontal, Sliders } from 'lucide-react';
import { AgentCategory } from '../types';

export const MarketplaceView: React.FC = () => {
  const { agents } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AgentCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'delivery'>('rating');

  // Categories list
  const categories: { label: string; value: AgentCategory | 'all' }[] = [
    { label: 'All Agents', value: 'all' },
    { label: 'Writing', value: 'writing' },
    { label: 'Image', value: 'image' },
    { label: 'Code', value: 'code' },
    { label: 'Research', value: 'research' },
    { label: 'Data', value: 'data' }
  ];

  // Perform client-side filter and sorting
  const processedAgents = useMemo(() => {
    let result = [...agents];

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        agent =>
          agent.name.toLowerCase().includes(query) ||
          agent.title.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // 2. Category Filter
    if (activeCategory !== 'all') {
      result = result.filter(agent => agent.category === activeCategory);
    }

    // 3. Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.pricePerTask - b.pricePerTask);
    } else if (sortBy === 'delivery') {
      // Map strings like "5m", "15m" to integers for accurate comparison
      const getMins = (str: string) => parseInt(str.replace('m', '')) || 99;
      result.sort((a, b) => getMins(a.avgDeliveryTime) - getMins(b.avgDeliveryTime));
    }

    return result;
  }, [agents, searchQuery, activeCategory, sortBy]);

  const handleCustomOrchestrate = () => {
    alert('ArcHire Orchestrator initialized. Our multi-agent router is analyzing your workspace to assemble custom pipelines. Coming soon!');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans antialiased text-slate-900 md:pl-64">
      <Navbar title="Marketplace" showBackButton={false} />

      <main className="mt-20 px-4 md:px-8 max-w-[1250px] mx-auto space-y-6">
        
        {/* Search input field */}
        <section className="relative group max-w-xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-xl font-medium text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            placeholder="Find your next AI specialist (e.g. VectorMind, Python)..."
          />
        </section>

        {/* Category horizontal scrolling chips */}
        <section className="overflow-x-auto hide-scrollbar select-none">
          <div className="flex gap-2.5 min-w-max pb-2">
            {categories.map(cat => {
              const isSelected = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all focus:outline-none ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Filters control and sorting row */}
        <section className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 flex-wrap gap-2 shadow-sm select-none">
          <h2 className="font-bold text-base md:text-lg text-slate-900">
            Available Agents{' '}
            <span className="text-slate-400 font-mono text-xs font-normal">
              ({processedAgents.length})
            </span>
          </h2>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent border-none font-bold text-xs text-primary focus:ring-0 cursor-pointer focus:outline-none"
            >
              <option value="rating">Top rated</option>
              <option value="price_low">Cheapest</option>
              <option value="delivery">Fastest</option>
            </select>
          </div>
        </section>

        {/* Agents Grid Feed */}
        {processedAgents.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </section>
        ) : (
          <section className="py-20 text-center bg-white rounded-xl border border-slate-200 p-8">
            <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700">No agents fit your query</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
              Try modifying your search or click on 'All Agents' to view original blueprints.
            </p>
          </section>
        )}

        {/* CTA Orchestration Banner */}
        <section className="mt-8 pt-4">
          <div className="bg-slate-900 rounded-xl p-6 md:p-12 relative overflow-hidden group border border-slate-850 select-none shadow-lg">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">
                Can't find what you're looking for?
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Describe your custom task and our orchestrator will build a bespoke agent team for you instantly, coordinating steps seamlessly.
              </p>
              <button
                onClick={handleCustomOrchestrate}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-bold text-xs tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Start Orchestration
              </button>
            </div>
            {/* Ambient visual glowing shapes */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
          </div>
        </section>

      </main>
    </div>
  );
};
