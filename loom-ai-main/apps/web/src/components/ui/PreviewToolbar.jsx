import React, { useState } from 'react';
import { RotateCw, Download, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import DeviceSwitcher from './DeviceSwitcher';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export function PreviewToolbar({ onRefresh, isFullscreen = false, onToggleFullscreen, onOpenFullPreview, onClose }) {
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
    <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
      {/* Left: Close + Title + Stack Badge */}
      <div className="flex items-center gap-2.5">
        {/* Close / hide preview */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Close preview"
            aria-label="Close preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wide">Preview</span>
      </div>

      {/* Right: Device Switcher & Quick Actions */}
      <div className="flex items-center gap-1">
        <DeviceSwitcher />

        <button
          onClick={onRefresh}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-xl transition-colors"
          title="Refresh Preview"
          aria-label="Refresh Preview"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-xl transition-colors"
          title={isFullscreen ? 'Exit full screen preview' : 'Open full screen preview'}
          aria-label={isFullscreen ? 'Exit full screen preview' : 'Open full screen preview'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>


        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
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
