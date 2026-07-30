/**
 * @file Tooltip.jsx
 * @description Accessible hover tooltip component for button labels and UI icons.
 */

import React, { useState } from 'react';

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-medium text-slate-100 bg-slate-900 border border-white/10 rounded-md shadow-xl whitespace-nowrap pointer-events-none animate-fade-in ${positionClasses[position]}`}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
