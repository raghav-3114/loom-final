/**
 * @file LoomLogo.jsx
 * @description Canvas-based Loom logo that loads the exact reference logo image,
 * strips its background to transparent, and paints the text pixels with
 * the app's purple-to-blue gradient.
 */

import React, { useEffect, useRef } from 'react';

const SIZES = {
  sm: { height: 28 },
  md: { height: 40 },
  lg: { height: 56 },
  xl: { height: 96 },
  hero: { height: 160 },
};

// Gradient colors: purple → blue
const GRADIENT_START = { r: 139, g: 92, b: 246 }; // #8b5cf6
const GRADIENT_END   = { r: 59,  g: 130, b: 241 }; // #3b82f1

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function LoomLogo({ size = 'md', className = '' }) {
  const canvasRef = useRef(null);
  const { height } = SIZES[size] || SIZES.md;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo-loom.png';

    img.onload = () => {
      const scale = height / img.height;
      const w = Math.round(img.width * scale);
      const h = height;

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness < 120) {
          // Dark pixel → text: paint with gradient colour based on x
          const px = (i / 4) % w;
          const t = px / w;
          data[i]     = lerp(GRADIENT_START.r, GRADIENT_END.r, t);
          data[i + 1] = lerp(GRADIENT_START.g, GRADIENT_END.g, t);
          data[i + 2] = lerp(GRADIENT_START.b, GRADIENT_END.b, t);
          // Use inverse brightness as alpha for smooth edges
          data[i + 3] = Math.min(255, Math.round((1 - brightness / 120) * 255 * 1.5));
        } else {
          // Light pixel → background: make fully transparent
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [height]);

  return (
    <span
      className={`inline-flex items-center select-none pl-3 ${className}`}
      aria-label="loom"
    >
      <canvas
        ref={canvasRef}
        style={{ height: `${height}px`, width: 'auto' }}
        className="pointer-events-none"
      />
    </span>
  );
}

export default LoomLogo;
