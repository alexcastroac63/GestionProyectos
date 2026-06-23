import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-6 shrink-0">
      <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
        <span>SCRUM Master: Sofía Ramírez</span>
        <span className="hidden sm:inline">•</span>
        <span>Autor Principal: Alex Castro</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">Release Candidate: v1.2.0-stable</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold text-slate-600 uppercase">All Systems Nominal</span>
      </div>
    </footer>
  );
};
