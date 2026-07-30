/**
 * @file EmptyState.jsx
 * @description Beautiful placeholder graphic & message for empty views.
 */

import React from 'react';
import { MonitorPlay } from 'lucide-react';

export function EmptyState({ icon: Icon = MonitorPlay, title = 'No Active Preview', description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>}
    </div>
  );
}

export default EmptyState;
