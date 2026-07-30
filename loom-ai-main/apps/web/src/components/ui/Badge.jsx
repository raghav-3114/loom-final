/**
 * @file Badge.jsx
 * @description Stack badge and status pill component for Vanilla, React + Tailwind, Builder, Reviewer, etc.
 */

import React from 'react';

export function Badge({ children, variant = 'indigo', className = '' }) {
  const variantStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
