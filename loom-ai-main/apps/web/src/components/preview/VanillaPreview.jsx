/**
 * @file VanillaPreview.jsx
 * @description Sandboxed iframe preview component for rendering generated Vanilla HTML, CSS, and JavaScript projects.
 */

import React, { useMemo } from 'react';

// Wrapped in React.memo so the iframe skips re-rendering entirely whenever an
// ancestor re-renders for an unrelated reason but `files` hasn't actually
// changed — belt-and-suspenders alongside the useMemo below.
export const VanillaPreview = React.memo(function VanillaPreview({ files }) {
  const htmlContent = useMemo(() => {
    const html = files['index.html'] || '<h1>Vanilla Preview</h1>';
    const css = files['style.css'] || '';
    const js = files['script.js'] || '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html.replace(/<script[\s\S]*?<\/script>/gi, '')}
          <script>${js}</script>
        </body>
      </html>
    `;
  }, [files]);

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
