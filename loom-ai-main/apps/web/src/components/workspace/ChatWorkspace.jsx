/**
 * @file ChatWorkspace.jsx
 * @description 3-pane AI workspace layout combining collapsible Sidebar, center ChatPanel, and right resizable PreviewPane.
 */

import React, { useState } from 'react';
import { ChevronRight, Settings, Plus } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import ChatPanel from '../chat/ChatPanel';
import PreviewPane from '../preview/PreviewPane';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export function ChatWorkspace() {
  const { files } = useProject();
  const { sidebarCollapsed, toggleSidebar, setIsSettingsModalOpen } = useUI();
  const { startNewChat } = useChat();
  const hasProjectFiles = Object.keys(files).length > 0;
  const [previewWidth, setPreviewWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e) => {
      const windowWidth = window.innerWidth;
      const newWidth = Math.min(Math.max(((windowWidth - e.clientX) / windowWidth) * 100, 25), 70);
      setPreviewWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden app-shell text-zinc-100 font-sans relative">
      {/* Floating Sidebar Toggle Button — normal arrow icon when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Floating New Chat Button — shown right below the sidebar toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={startNewChat}
          className="fixed top-16 left-4 z-40 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Floating Settings Button — shown only when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="fixed bottom-4 left-4 z-40 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      )}

      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Chat Workspace — transitions width naturally with flex layout */}
      <div className="flex-1 h-full min-w-0 transition-all duration-300 ease-in-out">
        <ChatPanel />
      </div>

      {hasProjectFiles && previewVisible && (
        <>
          {/* Resizable Drag Splitter Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-1 h-full bg-[var(--border-subtle)] hover:bg-indigo-500/50 cursor-col-resize flex items-center justify-center transition-colors z-30 ${
              isDragging ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : ''
            }`}
            title="Drag to resize Preview panel"
          >
            <div className="w-0.5 h-8 rounded-full bg-black/10 theme-dark:bg-white/20" />
          </div>

          {/* Right Preview Panel */}
          <div className="h-full min-w-0" style={{ width: `${previewWidth}%` }}>
            <PreviewPane onClose={() => setPreviewVisible(false)} />
          </div>
        </>
      )}

      {/* Re-open preview button — shown when preview is closed */}
      {hasProjectFiles && !previewVisible && (
        <button
          onClick={() => setPreviewVisible(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-all hover:scale-105 cursor-pointer"
          title="Show Preview"
        >
          Preview
        </button>
      )}
    </div>
  );
}

export default ChatWorkspace;
