/**
 * @file Textarea.jsx
 * @description Accessible styled glass textarea input field.
 */

import React from 'react';

export function Textarea({ label, error, className = '', id, ...props }) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none ${
          error ? 'border-red-500/50 focus:ring-red-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default Textarea;
