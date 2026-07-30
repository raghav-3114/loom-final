/**
 * @file UIContext.jsx
 * @description Centralized context for Loom AI UI state management.
 * Manages view mode (landing vs workspace), sidebar state, modal visibility, device preview mode, and toasts.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  // 'landing' or 'workspace'
  const [viewMode, setViewMode] = useState('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 'desktop' | 'tablet' | 'mobile'
  const [devicePreviewMode, setDevicePreviewMode] = useState('desktop');
  const [toastMessage, setToastMessage] = useState(null);

  // Stable across renders (only calls stable useState setters) — safe to
  // memoize unconditionally so consumers never see a new function identity.
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((prev) => !prev), []);

  // Memoized so the context value only changes reference when the actual UI
  // state changes — otherwise every consumer (e.g. the Live Preview, which
  // only cares about devicePreviewMode) re-renders whenever ANY unrelated UI
  // toggle fires elsewhere in the app (sidebar, modals, toasts), cascading
  // into anything downstream that isn't memoized.
  const value = useMemo(() => ({
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    devicePreviewMode,
    setDevicePreviewMode,
    toastMessage,
    showToast,
  }), [viewMode, sidebarCollapsed, toggleSidebar, isUploadModalOpen, isSettingsModalOpen, devicePreviewMode, toastMessage, showToast]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

export default UIContext;
