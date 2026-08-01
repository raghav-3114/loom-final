/**
 * @file ChatWorkspace.jsx
 * @description 3-pane AI workspace layout combining collapsible Sidebar, center ChatPanel, and right resizable PreviewPane.
 */

import React, { useState } from 'react';
import { ChevronRight, Settings } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import ChatPanel from '../chat/ChatPanel';
import PreviewPane from '../preview/PreviewPane';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';

export function ChatWorkspace() {
  const { files } = useProject();
  const { sidebarCollapsed, toggleSidebar, setIsSettingsModalOpen } = useUI();
  const hasProjectFiles = Object.keys(files).length > 0;
  const [previewWidth, setPreviewWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isToggleHovered, setIsToggleHovered] = useState(false);

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
    <div className="h-screen w-screen flex overflow-hidden app-shell text-zinc-100 select-none font-sans relative">
      {/* Floating Sidebar Toggle Button — shows "l" logo mark, arrow on hover */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setIsToggleHovered(true)}
          onMouseLeave={() => setIsToggleHovered(false)}
          className="fixed top-4 left-4 z-40 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Open Sidebar"
        >
          <div className="w-6 h-6 flex items-center justify-center relative">
            {/* Gradient "l" letter */}
            <span
              className={`absolute inset-0 flex items-center justify-center text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent transition-all duration-200 ease-in-out ${
                isToggleHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
              }`}
              style={{ fontFamily: 'var(--font-handwriting, cursive)', lineHeight: 1 }}
            >
              l
            </span>
            {/* Arrow icon */}
            <ChevronRight
              className={`w-5 h-5 absolute text-[var(--text-secondary)] transition-all duration-200 ease-in-out ${
                isToggleHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            />
          </div>
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

      {/* Center Chat Workspace — full width until project files exist */}
      <div
        className="flex-1 h-full min-w-0 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarCollapsed ? '0px' : '256px',
          width: hasProjectFiles ? `${100 - previewWidth}%` : undefined
        }}
      >
        <ChatPanel />
      </div>

      {hasProjectFiles && (
        <>
          {/* Resizable Drag Splitter Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-1.5 h-full bg-[#111111] hover:bg-indigo-500/50 cursor-col-resize flex items-center justify-center transition-colors z-30 ${
              isDragging ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : ''
            }`}
            title="Drag to resize Live Preview panel"
          >
            <div className="w-0.5 h-8 rounded-full bg-white/20" />
          </div>

          {/* Right Live Preview Panel */}
          <div className="h-full min-w-0" style={{ width: `${previewWidth}%` }}>
            <PreviewPane />
          </div>
        </>
      )}
    </div>
  );
}

export default ChatWorkspace;
