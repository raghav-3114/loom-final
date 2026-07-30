/**
 * @file LoomLogo.jsx
 * @description Redesigned blocky, geometric, pixel-grid style monospace wordmark for LOOM.
 * Features customizable sizes, glowing active pixel blocks, and subtle inactive pixel indentations.
 */

import React from 'react';

/**
 * LoomLogo component
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Logo scale
 * @param {string} [props.className=''] - Additional CSS classes
 */
export function LoomLogo({ size = 'md', className = '' }) {
  // 5x5 Grid matrix for each letter in L-O-O-M
  const letters = [
    // L
    [
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1]
    ],
    // O
    [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    // O
    [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    // M
    [
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1]
    ]
  ];

  const sizeStyles = {
    sm: 'h-6 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
  };

  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`} aria-label="LOOM AI Logo">
      <svg
        viewBox="0 0 166 34"
        className={`${selectedSize} transition-all duration-300`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pixel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#c7d2fe" /> {/* indigo-200 */}
            <stop offset="100%" stopColor="#818cf8" /> {/* indigo-400 */}
          </linearGradient>
          <filter id="pixel-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {letters.map((matrix, lIdx) => {
          const xOffset = lIdx * 44; // 34px width + 10px spacing
          return (
            <g key={lIdx}>
              {matrix.map((row, rIdx) => {
                const y = rIdx * 7; // 6px size + 1px gap
                return row.map((pixel, cIdx) => {
                  const x = xOffset + cIdx * 7; // 6px size + 1px gap
                  
                  if (pixel === 1) {
                    return (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={x}
                        y={y}
                        width={6}
                        height={6}
                        fill="url(#pixel-grad)"
                        filter="url(#pixel-glow)"
                        className="transition-all duration-300 hover:fill-indigo-300"
                      />
                    );
                  } else {
                    return (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={x}
                        y={y}
                        width={6}
                        height={6}
                        fill="rgba(255, 255, 255, 0.04)"
                      />
                    );
                  }
                });
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default LoomLogo;
