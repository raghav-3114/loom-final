/**
 * @file SettingsModal.jsx
 * @description Simplified settings modal displaying strictly the Theme options selector.
 */

import React from 'react';
import { Monitor } from 'lucide-react';
import Modal from '../ui/Modal';
import { useUI } from '../../contexts/UIContext';

const THEME_OPTIONS = [
  {
    id: 'dark',
    label: 'Dark',
    previewClass: 'bg-[#020617]',
    accentClass: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500',
  },
  {
    id: 'light',
    label: 'Light',
    previewClass: 'bg-[#f8fafc]',
    accentClass: 'bg-gradient-to-br from-blue-400 via-indigo-400 to-indigo-300',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    previewClass: 'bg-[#02020f]',
    accentClass: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400',
  },
  {
    id: 'system',
    label: 'System',
    previewClass: 'bg-gradient-to-r from-[#020617] to-[#f8fafc]',
    accentClass: 'bg-gradient-to-br from-slate-500 to-indigo-400',
    isSystem: true,
  },
];

function ThemePreviewCard({ option, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className={`group flex flex-col gap-2.5 p-2 rounded-xl transition-all duration-200 text-left ${
        isSelected
          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--bg-dark)]'
          : 'ring-1 ring-[var(--border-subtle)] hover:ring-[var(--text-muted)]'
      }`}
      aria-pressed={isSelected}
      aria-label={`${option.label} theme`}
    >
      <div
        className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[var(--border-subtle)] ${option.previewClass}`}
      >
        <div className={`absolute bottom-0 left-0 right-0 h-1/3 ${option.accentClass} opacity-90`} />
        {option.isSystem && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white/70 theme-light:text-slate-800 drop-shadow-md" />
          </div>
        )}
        <div className="absolute top-2 left-2 w-8 h-1.5 rounded-full bg-white/20 theme-light:bg-black/10" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/15 theme-light:bg-black/5" />
      </div>
      <span
        className={`text-xs font-semibold text-center w-full ${
          isSelected ? 'text-indigo-500 theme-dark:text-indigo-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
        }`}
      >
        {option.label}
      </span>
    </button>
  );
}

export function SettingsModal() {
  const { isSettingsModalOpen, setIsSettingsModalOpen, theme, setTheme } = useUI();

  return (
    <Modal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      title="Settings"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Theme</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Choose how Loom AI looks on your device.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {THEME_OPTIONS.map((option) => (
              <ThemePreviewCard
                key={option.id}
                option={option}
                isSelected={theme === option.id}
                onSelect={setTheme}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SettingsModal;
