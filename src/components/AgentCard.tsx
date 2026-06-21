import React from 'react';
import { Link } from 'react-router-dom';
import { Agent } from '../types';
import { Star, Shield, ArrowRight } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const isEmojiAvatar = !agent.avatarUrl.startsWith('http');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between overflow-hidden group">
      {/* Escrow Protected Flag */}
      {agent.escrowProtected && (
        <div className="absolute top-4 right-4 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1 border border-blue-100 select-none">
          <Shield className="w-3 H-3 text-primary" fill="currentColor" />
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
            Escrow Protected
          </span>
        </div>
      )}

      {/* Hero content info */}
      <div className="flex items-start gap-4 mb-4 mt-2">
        <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-blue-50 flex items-center justify-center text-2xl shadow-inner select-none">
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
          <h3 className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
            {agent.category}
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1 pb-4">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {agent.description}
        </p>

        {/* Rating detail */}
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
          <span className="text-xs font-bold text-slate-700">{agent.rating.toFixed(1)}</span>
          <span className="text-xs text-slate-400">({agent.reviewCount.toLocaleString()} jobs)</span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className="text-xs text-slate-400 font-semibold">{agent.avgDeliveryTime} delivery</span>
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {agent.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-slate-50 border border-slate-250/60 rounded-full text-[10px] font-medium text-slate-500 hover:text-primary hover:border-blue-200 transition-colors"
            >
              #{tag.toLowerCase().replace(/\s+/g, '')}
            </span>
          ))}
        </div>
      </div>

      {/* Rate footer and detailed action */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto select-none">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Escrow Required</p>
          <p className="text-base font-bold text-slate-900">
            ${agent.pricePerTask.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-450">/ task</span>
          </p>
        </div>

        <Link
          to={`/agent/${agent.id}`}
          className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>Hire</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
