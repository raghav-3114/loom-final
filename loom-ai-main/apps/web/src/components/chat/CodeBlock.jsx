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
    <div className="my-3 rounded-xl bg-black/5 theme-dark:bg-slate-950/80 border border-black/5 theme-dark:border-white/10 shadow-sm theme-dark:shadow-xl text-xs font-mono">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/[0.03] theme-dark:bg-slate-900/60 border-b border-black/5 theme-dark:border-white/10 text-[var(--text-secondary)]">
        <span className="font-sans font-semibold text-[11px] text-indigo-600 theme-dark:text-indigo-400">{title || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-sans hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 theme-dark:text-emerald-400" />
              <span className="text-emerald-600 theme-dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Body */}
      <pre className="p-4 overflow-x-auto custom-scrollbar text-[var(--text-primary)] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
