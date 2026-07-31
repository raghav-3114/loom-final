import React, { useState } from 'react';
import { RotateCw, ExternalLink, Eye, Download, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import DeviceSwitcher from './DeviceSwitcher';
import Badge from './Badge';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export function PreviewToolbar({ onRefresh, isFullscreen = false, onToggleFullscreen, onOpenFullPreview }) {
  const { activeStack } = useProject();
  const { showToast } = useUI();
  const { activeProjectId } = useChat();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!activeProjectId) {
      showToast('Generate a project before downloading', 'warning');
      return;
    }
    
    setIsDownloading(true);
    showToast('Preparing ZIP export...', 'info');
    
    try {
      const response = await fetch(`/api/download/${activeProjectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loom-project-${activeProjectId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('ZIP downloaded successfully!', 'success');
    } catch (err) {
      console.error('[Download] Error:', err);
      showToast(`ZIP download failed: ${err.message}. Please try again later.`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-white/10 backdrop-blur-md">
      {/* Title & Stack Badge */}
      <div className="flex items-center gap-2.5">
        <Eye className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-200 tracking-wide">Live Preview</span>
        <Badge variant={activeStack === 'vanilla' ? 'indigo' : 'purple'}>
          {activeStack === 'vanilla' ? 'Vanilla HTML/CSS/JS' : 'React + Tailwind'}
        </Badge>
      </div>

      {/* Device Switcher & Quick Actions */}
      <div className="flex items-center gap-2">
        <DeviceSwitcher />
        
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
          title="Refresh Preview"
          aria-label="Refresh Preview"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
          title={isFullscreen ? 'Exit full screen preview' : 'Open full screen preview'}
          aria-label={isFullscreen ? 'Exit full screen preview' : 'Open full screen preview'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onOpenFullPreview}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
          title="Open in new window"
          aria-label="Open in new window"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
          title="Download Project ZIP"
          aria-label="Download Project ZIP"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default PreviewToolbar;
