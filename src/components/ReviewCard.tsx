import React from 'react';
import { Review } from '../types';
import { Star, User } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <article className="bg-white rounded-xl p-4 border border-slate-200 flex gap-4 hover:translate-y-[-2px] transition-transform duration-300">
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-200 text-primary">
        <User className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-slate-800">{review.reviewerName}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{review.timeAgo}</span>
        </div>
        
        {/* Render rating stars */}
        <div className="flex gap-0.5 my-1 text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5"
              fill={i < review.rating ? "currentColor" : "none"}
            />
          ))}
        </div>

        <p className="text-slate-500 text-xs leading-relaxed mt-1">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>
    </article>
  );
};
