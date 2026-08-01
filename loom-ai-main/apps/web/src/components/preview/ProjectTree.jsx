import React from 'react';
import { FileCode, FileText, ChevronLeft, ChevronRight, Folder } from 'lucide-react';

export function ProjectTree({ files = {}, activeFileName, onSelectFile, isCollapsed, onToggle }) {
  const getFileIcon = (filename) => {
    if (filename.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-400" />;
    if (filename.endsWith('.css'))  return <FileText className="w-4 h-4 text-blue-400" />;
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
  };

  const fileKeys = Object.keys(files);

  return (
    /* Outer wrapper — fixed width, slides left via transform */
    <div
      className={`
        h-full flex-shrink-0 overflow-hidden
        bg-[var(--bg-card)] border-r border-[var(--border-subtle)]
        flex flex-col select-none
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-52 opacity-100'}
      `}
    >
      {/* Explorer Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] tracking-wider shrink-0">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>PROJECT FILES</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded transition-colors"
          title="Collapse Explorer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
        {fileKeys.length === 0 ? (
          <div className="p-3 text-[11px] text-[var(--text-muted)] italic text-center">No files in project</div>
        ) : (
          fileKeys.map((filename) => {
            const isActive = filename === activeFileName;
            const displayName = filename.startsWith('/') ? filename.substring(1) : filename;
            return (
              <button
                key={filename}
                onClick={() => onSelectFile(filename)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg transition-all text-left ${
                  isActive
                    ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-semibold'
                    : 'border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/[0.05]'
                }`}
              >
                {getFileIcon(filename)}
                <span className="truncate">{displayName}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProjectTree;
