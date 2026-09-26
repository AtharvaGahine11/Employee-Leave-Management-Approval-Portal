import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse">
    <div className="h-4 w-28 bg-slate-200 rounded mb-4"></div>
    <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
    <div className="h-3 w-36 bg-slate-100 rounded"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-14 border-b border-slate-100 px-6 flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
        <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
      </div>
    ))}
  </div>
);

export const PageHeaderSkeleton: React.FC = () => (
  <div className="animate-pulse mb-8">
    <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
    <div className="h-4 w-80 bg-slate-100 rounded"></div>
  </div>
);
