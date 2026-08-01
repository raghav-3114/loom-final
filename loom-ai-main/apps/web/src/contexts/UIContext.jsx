/**
 * @file UIContext.jsx
 * @description Centralized context for Loom AI UI state management.
 * Manages theme, sidebar state, modal visibility, device preview mode, and toasts.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useLayoutEffect, useEffect } from 'react';

const UIContext = createContext(null);

const THEME_STORAGE_KEY = 'loom-theme';
const THEME_CLASSES = ['theme-dark', 'theme-light'];
const VALID_THEMES = ['dark', 'light', 'system'];

function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(stored) ? stored : 'dark';
}

function resolveActiveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyThemeClass(theme) {
  const root = document.documentElement;
  const active = resolveActiveTheme(theme);
  THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
  root.classList.add(`theme-${active}`);
}

export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 'desktop' | 'tablet' | 'mobile'
  const [devicePreviewMode, setDevicePreviewMode] = useState('desktop');
  const [toastMessage, setToastMessage] = useState(null);

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  // Apply theme class before paint and whenever preference changes
  useLayoutEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Re-resolve when OS color scheme changes while 'system' is selected
  useEffect(() => {
    if (theme !== 'system') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      console.log('[UIContext] System theme color scheme changed.');
      applyThemeClass('system');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((prev) => !prev), []);

  const value = useMemo(() => ({
    theme,
    setTheme,
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
  }), [theme, setTheme, sidebarCollapsed, toggleSidebar, isUploadModalOpen, isSettingsModalOpen, devicePreviewMode, toastMessage, showToast]);

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
