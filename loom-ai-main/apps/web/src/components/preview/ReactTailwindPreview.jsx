/**
 * @file ReactTailwindPreview.jsx
 * @description In-browser bundler sandbox preview component for React + Tailwind CSS code using Sandpack or container stub.
 */

import React, { useMemo } from 'react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';

// Wrapped in React.memo so this component (and the expensive Sandpack bundler
// it mounts) skips re-rendering entirely whenever an ancestor re-renders for
// an unrelated reason but the `files` prop reference hasn't actually changed.
export const ReactTailwindPreview = React.memo(function ReactTailwindPreview({ files }) {
  // Memoized on [files] so Sandpack only ever receives a new `files` object
  // reference when the actual generated files change. SandpackProvider treats
  // any new object reference as changed content and fully reinitializes its
  // bundler/iframe — without this memo, ANY unrelated parent re-render (e.g.
  // typing in the prompt box, toggling a UI panel) rebuilds this object fresh
  // and resets the entire live preview, even though nothing here changed.
  const sandpackFiles = useMemo(() => {
    // 1. Map all files from ProjectContext to Sandpack, standardizing path keys
    const mapped = {};
    Object.entries(files || {}).forEach(([path, content]) => {
      const sandpackPath = path.startsWith('/') ? path : `/${path}`;
      mapped[sandpackPath] = content;
    });

    // 2. Inject Tailwind CSS Play CDN script to Sandpack HTML entry point
    mapped['/public/index.html'] = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Loom React App</title>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
  </body>
</html>
  `.trim();

    // 3. Fallback entry logic to ensure dynamic components (e.g. /Counter.js) render in /App.js
    const hasAppFile = mapped['/App.js'] || mapped['/App.jsx'] || mapped['/src/App.js'] || mapped['/src/App.jsx'];
    if (!hasAppFile) {
      // Find the first component file in the project
      const componentFile = Object.keys(mapped).find(
        (path) => (path.endsWith('.js') || path.endsWith('.jsx')) && path !== '/public/index.html'
      );
      if (componentFile) {
        const compName = componentFile.split('/').pop().replace(/\.(js|jsx)$/, '');
        mapped['/App.js'] = `
import React from 'react';
import ${compName} from '.${componentFile}';

export default function App() {
  return <${compName} />;
}
      `.trim();
      } else {
        mapped['/App.js'] = `
import React from 'react';

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      No React component found in the project.
    </div>
  );
}
      `.trim();
      }
    }

    return mapped;
  }, [files]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-950 flex flex-col">
      <SandpackProvider
        template="react"
        theme="dark"
        files={sandpackFiles}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
          },
        }}
      >
        <SandpackPreview className="w-full h-full border-none" showOpenInCodeSandbox={false} showRefreshButton={false} />
      </SandpackProvider>
    </div>
  );
});

export default ReactTailwindPreview;
