/**
 * @file App.jsx
 * @description Main application shell wrapping providers, ChatWorkspace, modals, and toasts.
 */

import React from 'react';
import { UIProvider, useUI } from './contexts/UIContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ChatProvider } from './contexts/ChatContext';
import ChatWorkspace from './components/workspace/ChatWorkspace';
import SettingsModal from './components/settings/SettingsModal';
import Toast from './components/ui/Toast';
function AppContent() {
  const { toastMessage } = useUI();

  return (
    <div className="min-h-screen app-shell text-slate-100 font-sans antialiased overflow-hidden relative">
      <ChatWorkspace />

      {/* Global Modals */}
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
