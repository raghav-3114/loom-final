/**
 * @file PreviewPane.jsx
 * @description Main container for the Live Preview right panel, wrapping preview toolbar, device responsive frame, and dynamic stack renderers.
 */

import React, { useState, useEffect } from 'react';
import PreviewToolbar from '../ui/PreviewToolbar';
import VanillaPreview, { createVanillaPreviewDocument } from './VanillaPreview';
import ReactTailwindPreview from './ReactTailwindPreview';
import ProjectTree from './ProjectTree';
import Tabs from '../ui/Tabs';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import EmptyState from '../ui/EmptyState';

export function PreviewPane() {
  const { activeStack, files, activeFileName, setActiveFileName } = useProject();
  const { devicePreviewMode } = useUI();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasGeneratedCode = Object.keys(files || {}).length > 0;

  // Auto-select a sensible default file whenever new files arrive and
  // nothing (or a now-stale filename) is currently selected.
  useEffect(() => {
    if (!hasGeneratedCode) return;
    if (activeFileName && files[activeFileName] !== undefined) return;
    setActiveFileName(Object.keys(files)[0]);
  }, [files, hasGeneratedCode, activeFileName, setActiveFileName]);

  const deviceWidthClasses = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-[90%] my-auto shadow-2xl rounded-2xl border border-white/20',
    mobile: 'w-[375px] h-[667px] my-auto shadow-2xl rounded-3xl border-4 border-slate-800',
  };

  const handleSelectFile = (filename) => {
    setActiveFileName(filename);
    setActiveTab('code');
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.warn('[Preview] Could not exit browser fullscreen:', error);
        }
      }
      setIsFullscreen(false);
      return;
    }

    setActiveTab('preview');
    setIsFullscreen(true);
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        // The expanded in-app preview remains available when the browser
        // blocks its native fullscreen request.
        console.warn('[Preview] Browser fullscreen was not available:', error);
      }
    }
  };

  const openFullPreview = () => {
    if (activeStack !== 'vanilla') {
      toggleFullscreen();
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    previewWindow.document.write('<!doctype html><title>Loom Preview</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0}</style><iframe sandbox="allow-scripts" title="Loom Preview"></iframe>');
    previewWindow.document.close();
    previewWindow.document.querySelector('iframe').srcdoc = createVanillaPreviewDocument(files, activeFileName);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const viewTabs = [
    { id: 'preview', label: 'Live Preview' },
    { id: 'code', label: 'Code View' },
  ];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] border-none' : 'h-full border-l'} flex flex-col bg-slate-950/90 border-white/10 overflow-hidden`}>
      {/* Top Toolbar */}
      <PreviewToolbar
        onRefresh={() => setRefreshKey((k) => k + 1)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenFullPreview={openFullPreview}
      />

      {/* View Tabs bar */}
      {hasGeneratedCode && !isFullscreen && (
        <div className="px-4 py-2 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <Tabs tabs={viewTabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === 'code' && activeFileName && (
            <span className="text-[11px] text-slate-500 font-mono italic">
              Viewing: {activeFileName.startsWith('/') ? activeFileName.substring(1) : activeFileName}
            </span>
          )}
        </div>
      )}

      {/* Main Body - Project Tree & Viewport Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Project Tree Sidebar */}
        {hasGeneratedCode && !isFullscreen && (
          <ProjectTree
            files={files}
            activeFileName={activeFileName}
            onSelectFile={handleSelectFile}
            isCollapsed={isTreeCollapsed}
            onToggle={() => setIsTreeCollapsed(!isTreeCollapsed)}
          />
        )}

        {/* Viewport Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/40 relative overflow-hidden custom-scrollbar">
          {!hasGeneratedCode ? (
            <EmptyState
              title="Live Preview Standby"
              description="Enter a prompt or choose a template to see your generated HTML/CSS/JS or React website render live."
            />
          ) : activeTab === 'preview' ? (
            <div key={refreshKey} className={`transition-all duration-300 ${deviceWidthClasses[devicePreviewMode]}`}>
              {activeStack === 'vanilla' ? (
                <VanillaPreview files={files} activeFileName={activeFileName} />
              ) : (
                <ReactTailwindPreview files={files} />
              )}
            </div>
          ) : (
            <div className="w-full h-full p-4 overflow-auto bg-slate-950/60 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar rounded-xl border border-white/10 select-text">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 text-[11px] text-violet-400 font-medium">
                <span>{activeFileName ? (activeFileName.startsWith('/') ? activeFileName.substring(1) : activeFileName) : '—'}</span>
                <span className="text-[10px] text-slate-500 uppercase">{activeFileName ? activeFileName.split('.').pop() : ''} file</span>
              </div>
              <code className="block whitespace-pre">{activeFileName ? (files[activeFileName] || '// No content or select a file') : '// No file selected'}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPane;
