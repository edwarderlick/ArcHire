import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { Lock, LockOpen, Sparkles, AlertCircle, FileSpreadsheet, Hourglass } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (job.status) {
      case 'active':
        return (
          <span className="bg-amber-50/70 text-amber-700 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'review':
        return (
          <span className="bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 animate-pulse">
            <Sparkles className="w-3 h-3 text-primary animate-spin-hover" />
            Review Ready
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getSubText = () => {
    if (job.status === 'active') {
      return (
        <span className="text-slate-400 text-xs flex items-center gap-1 font-semibold">
          <Hourglass className="w-3.5 h-3.5" />
          Est. 15 mins remaining
        </span>
      );
    } else if (job.status === 'review') {
      return (
        <span className="text-blue-700 text-xs flex items-center gap-1 font-bold">
          <AlertCircle className="w-3.5 h-3.5 text-primary" />
          Review completes in 23h
        </span>
      );
    } else {
      return (
        <span className="text-slate-400 text-xs">
          Completed on {job.completedAt || job.createdAt}
        </span>
      );
    }
  };

  const isEmojiAvatar = !job.agentAvatarUrl.startsWith('http');

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Hired Agent Metadata and title */}
        <div className="flex items-center gap-4">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-blue-50 flex-shrink-0 border border-slate-200 flex items-center justify-center">
            {isEmojiAvatar ? (
              <span className="text-xl">{job.agentAvatarUrl}</span>
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
            <h3 className="font-bold text-slate-900 text-base line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getStatusBadge()}
              {getSubText()}
            </div>
          </div>
        </div>

        {/* Escrow Locks & Navigation button */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-mono">
            {job.status === 'completed' ? (
              <>
                <LockOpen className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600">
                  ${job.amountUSDC.toFixed(2)} Released
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-primary" fill="currentColor" />
                <span className="text-xs font-bold text-primary">
                  ${job.amountUSDC.toFixed(2)} in Escrow
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => navigate(`/job/${job.id}`)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all focus:outline-none cursor-pointer ${
              job.status === 'review'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {job.status === 'review' ? 'Review Now' : 'View Job Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
