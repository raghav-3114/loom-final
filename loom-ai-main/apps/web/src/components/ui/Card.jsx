/**
 * @file Card.jsx
 * @description Glassmorphism card component with glowing border effects and backdrop blur.
 */

import React from 'react';

export function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-300 ${
        hoverable ? 'hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
