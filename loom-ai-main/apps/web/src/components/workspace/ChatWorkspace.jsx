/**
 * @file ChatWorkspace.jsx
 * @description 3-pane AI workspace layout combining collapsible Sidebar, center ChatPanel, and right resizable PreviewPane.
 */

import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import ChatPanel from '../chat/ChatPanel';
import PreviewPane from '../preview/PreviewPane';

export function ChatWorkspace() {
  const [previewWidth, setPreviewWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="h-screen w-screen flex overflow-hidden bg-[#050505] text-zinc-100 select-none font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Chat Workspace */}
      <div className="flex-1 h-full min-w-0" style={{ width: `${100 - previewWidth}%` }}>
        <ChatPanel />
      </div>

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
    </div>
  );
}

export default ChatWorkspace;
