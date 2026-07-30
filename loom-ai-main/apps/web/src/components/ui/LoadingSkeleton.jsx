/**
 * @file LoadingSkeleton.jsx
 * @description Shimmer loading skeleton UI placeholders.
 */

import React from 'react';

export function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-slate-800/80 rounded-md"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
