/**
 * @file Toast.jsx
 * @description Floating notification toast component.
 */

import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export function Toast({ message, type = 'info' }) {
  if (!message) return null;

  const icons = {
    info: <Info className="w-4 h-4 text-indigo-400" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    error: <XCircle className="w-4 h-4 text-rose-500" />,
  };

  const borders = {
    info: 'border-white/15 bg-slate-900/90',
    success: 'border-emerald-500/30 bg-slate-900/90',
    warning: 'border-amber-500/30 bg-slate-900/90',
    error: 'border-rose-500/30 bg-slate-900/90',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 border rounded-xl shadow-2xl backdrop-blur-xl text-slate-100 text-xs animate-fade-in ${borders[type] || borders.info}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}

export default Toast;
