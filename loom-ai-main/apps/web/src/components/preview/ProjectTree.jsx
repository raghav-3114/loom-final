import React from 'react';
import { FileCode, FileText, ChevronRight, Folder } from 'lucide-react';

export function ProjectTree({ files = {}, activeFileName, onSelectFile, isCollapsed, onToggle }) {
  const getFileIcon = (filename) => {
    if (filename.endsWith('.html')) {
      return <FileCode className="w-4 h-4 text-orange-400" />;
    }
    if (filename.endsWith('.css')) {
      return <FileText className="w-4 h-4 text-blue-400" />;
    }
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const fileKeys = Object.keys(files);

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-slate-950/40 border-r border-white/10 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggle}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
          title="Expand Explorer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 h-full bg-slate-950/40 border-r border-white/10 flex flex-col select-none">
      {/* Explorer Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>PROJECT FILES</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded transition-colors text-[10px] uppercase font-bold"
          title="Collapse Explorer"
        >
          Hide
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
        {fileKeys.length === 0 ? (
          <div className="p-3 text-[11px] text-slate-500 italic text-center">No files in project</div>
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
                    ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 font-semibold'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
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
