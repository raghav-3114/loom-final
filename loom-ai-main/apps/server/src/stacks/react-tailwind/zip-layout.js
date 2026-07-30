/**
 * Zip layout helper for the "react-tailwind" stack.
 * Formats React + Tailwind project structures into standard React app layouts for archive export.
 */

/**
 * Maps React + Tailwind project files to archive path destinations.
 * @param {Array<Object>} files - List of generated file objects.
 * @returns {Array<Object>} List of mapped files ready for archiver processing.
 */
function createReactTailwindZipLayout(files) {
  const result = {};
  
  // Standardize paths by removing leading slashes for comparison
  const cleanFiles = {};
  Object.entries(files || {}).forEach(([p, content]) => {
    const cleanPath = p.startsWith('/') ? p.substring(1) : p;
    cleanFiles[cleanPath] = content;
  });

  // 1. Move all project components to the src/ directory
  Object.entries(cleanFiles).forEach(([p, content]) => {
    if (p.startsWith('src/')) {
      result[p] = content;
    } else {
      result[`src/${p}`] = content;
    }
  });

  // 2. Generate standard /src/App.js if App file is missing
  const hasApp = result['src/App.js'] || result['src/App.jsx'] || result['src/App.tsx'] || result['src/App.ts'];
  if (!hasApp) {
    // Find first component in cleanFiles
    const firstComp = Object.keys(cleanFiles).find(k => k.endsWith('.js') || k.endsWith('.jsx'));
    if (firstComp) {
      const compName = firstComp.replace(/\.(js|jsx)$/, '');
      result['src/App.js'] = `
import React from 'react';
import ${compName} from './${compName}';

export default function App() {
  return <${compName} />;
}
      `.trim();
    } else {
      result['src/App.js'] = `
import React from 'react';

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1>Loom Generated React App</h1>
    </div>
  );
}
      `.trim();
    }
  }

  // 3. Inject config files if not already present
  if (!result['package.json']) {
    result['package.json'] = JSON.stringify({
      name: "loom-generated-react-app",
      version: "0.1.0",
      private: true,
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
        "lucide-react": "^0.344.0"
      },
      scripts: {
        "start": "react-scripts start",
        "build": "react-scripts build"
      },
      browserslist: {
        "production": [">0.2%", "not dead", "not op_mini all"],
        "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
      }
    }, null, 2);
  }

  if (!result['tailwind.config.js']) {
    result['tailwind.config.js'] = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
    `.trim();
  }

  if (!result['postcss.config.js']) {
    result['postcss.config.js'] = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
    `.trim();
  }

  if (!result['public/index.html']) {
    result['public/index.html'] = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Tailwind App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
    `.trim();
  }

  if (!result['src/index.js']) {
    result['src/index.js'] = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    `.trim();
  }

  if (!result['src/index.css']) {
    result['src/index.css'] = `
@tailwind base;
@tailwind components;
@tailwind utilities;
    `.trim();
  }

  return result;
}

module.exports = {
  createReactTailwindZipLayout,
};
