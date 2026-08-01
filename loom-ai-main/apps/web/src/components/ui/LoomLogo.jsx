/**
 * @file LoomLogo.jsx
 * @description Canvas-based Loom logo that loads the exact reference logo image,
 * strips its background to transparent, and paints the text pixels with
 * the app's purple-to-blue gradient.
 */

import React, { useEffect, useRef } from 'react';

const SIZES = {
  xs: { height: 16 },
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
      const dpr = window.devicePixelRatio || 1;
      const scale = height / img.height;
      const logicalWidth = Math.round(img.width * scale);
      const logicalHeight = height;

      // Scale canvas internal resolution by device pixel ratio for ultra-sharpness
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;

      // Keep logical display dimensions via CSS styles
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      // Scale context to draw high-res image
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, logicalWidth, logicalHeight);

      // Process raw pixel values at high-res
      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;

        // Paint with brand gradient based on x position
        const px = (i / 4) % w;
        const t = px / w;
        data[i]     = lerp(GRADIENT_START.r, GRADIENT_END.r, t);
        data[i + 1] = lerp(GRADIENT_START.g, GRADIENT_END.g, t);
        data[i + 2] = lerp(GRADIENT_START.b, GRADIENT_END.b, t);

        // Smooth luminance-to-alpha mapping (fully transparent background, anti-aliased edges)
        let alpha = 0;
        if (brightness < 220) {
          alpha = Math.min(255, Math.round((1 - brightness / 220) * 255 * 1.6));
        }
        data[i + 3] = alpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [height]);

  return (
    <span
      className={`inline-flex items-center select-none ${className || 'pl-3'}`}
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
