/**
 * @file VanillaPreview.jsx
 * @description Sandboxed iframe preview component for rendering generated Vanilla HTML, CSS, and JavaScript projects.
 */

import React, { useMemo } from 'react';

export function createVanillaPreviewDocument(files, activeFileName) {
  let html = null;

  // 1. If the active file is an HTML file, prioritize it
  if (activeFileName && activeFileName.toLowerCase().endsWith('.html')) {
    html = files[activeFileName];
  }

  // 2. Fallback to index.html
  if (!html) {
    html = files['index.html'];
  }

  // 3. Fallback to any other .html file
  if (!html) {
    const htmlKey = Object.keys(files || {}).find((key) => key.toLowerCase().endsWith('.html'));
    if (htmlKey) {
      html = files[htmlKey];
    }
  }

  // 4. Final fallback
  if (!html) {
    html = '<h1>Vanilla Preview</h1>';
  }

  // Inline linked CSS files referenced via <link rel="stylesheet" href="...">
  let processedHtml = html.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
    // Normalise path (remove leading slashes or dot-slashes)
    const cleanHref = href.replace(/^\.?\//, '');
    if (files[cleanHref] !== undefined) {
      return `<style data-inlined="${cleanHref}">${files[cleanHref]}</style>`;
    }
    return match;
  });

  // Inline linked JS files referenced via <script src="..."></script>
  processedHtml = processedHtml.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
    const cleanSrc = src.replace(/^\.?\//, '');
    if (files[cleanSrc] !== undefined) {
      return `<script data-inlined="${cleanSrc}">${files[cleanSrc]}</script>`;
    }
    return match;
  });

  // Inject default style.css and script.js if they exist and aren't explicitly referenced/inlined
  let defaultCss = '';
  if (files['style.css'] && !html.includes('style.css')) {
    defaultCss = `<style>${files['style.css']}</style>`;
  }

  let defaultJs = '';
  if (files['script.js'] && !html.includes('script.js')) {
    defaultJs = `<script>${files['script.js']}</script>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${defaultCss}
      </head>
      <body>
        ${processedHtml}
        ${defaultJs}
      </body>
    </html>
  `;
}

// Wrapped in React.memo so the iframe skips re-rendering entirely whenever an
// ancestor re-renders for an unrelated reason but `files` hasn't actually
// changed — belt-and-suspenders alongside the useMemo below.
export const VanillaPreview = React.memo(function VanillaPreview({ files, activeFileName }) {
  const htmlContent = useMemo(() => {
    return createVanillaPreviewDocument(files, activeFileName);
  }, [files, activeFileName]);

  return (
    <iframe
      title="Vanilla HTML/CSS/JS Live Preview"
      srcDoc={htmlContent}
      sandbox="allow-scripts"
      className="w-full h-full border-none bg-white rounded-xl shadow-inner"
    />
  );
});

export default VanillaPreview;
