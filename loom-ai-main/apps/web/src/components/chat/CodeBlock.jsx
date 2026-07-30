/**
 * @file CodeBlock.jsx
 * @description Code block display component with syntax highlighting styling and one-click copy to clipboard action.
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({ code, language = 'javascript', title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl bg-slate-950 border border-white/10 overflow-hidden shadow-xl text-xs font-mono">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 text-slate-400">
        <span className="font-sans font-medium text-[11px] text-indigo-300">{title || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-sans hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Body */}
      <pre className="p-4 overflow-x-auto custom-scrollbar text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
