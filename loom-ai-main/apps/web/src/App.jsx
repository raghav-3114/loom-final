/**
 * @file App.jsx
 * @description Main application shell wrapping providers, rendering in-state view transitions (LandingView vs ChatWorkspace), modals, and toasts.
 */

import React from 'react';
import { UIProvider, useUI } from './contexts/UIContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ChatProvider } from './contexts/ChatContext';
import LandingView from './components/landing/LandingView';
import ChatWorkspace from './components/workspace/ChatWorkspace';
import UploadPanel from './components/upload/UploadPanel';
import SettingsModal from './components/settings/SettingsModal';
import Toast from './components/ui/Toast';
import CustomCursor from './components/ui/CustomCursor';

function AppContent() {
  const { viewMode, toastMessage } = useUI();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden relative">
      <CustomCursor />
      
      {/* Dynamic View Transition */}
      {viewMode === 'landing' ? <LandingView /> : <ChatWorkspace />}

      {/* Global Modals */}
      <UploadPanel />
      <SettingsModal />

      {/* Global Toast */}
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} />}
    </div>
  );
}

export function App() {
  return (
    <UIProvider>
      <ProjectProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </ProjectProvider>
    </UIProvider>
  );
}

export default App;
