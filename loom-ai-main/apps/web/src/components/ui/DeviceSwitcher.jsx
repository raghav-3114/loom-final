/**
 * @file DeviceSwitcher.jsx
 * @description Toolbar control component for switching Live Preview viewport sizes (Desktop, Tablet, Mobile).
 */

import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

export function DeviceSwitcher() {
  const { devicePreviewMode, setDevicePreviewMode } = useUI();

  const devices = [
    { id: 'desktop', label: 'Desktop', icon: Monitor },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
  ];

  return (
    <div className="flex items-center bg-black/5 theme-dark:bg-white/5 p-0.5 rounded-xl border border-[var(--border-subtle)]">
      {devices.map((device) => {
        const Icon = device.icon;
        const isActive = devicePreviewMode === device.id;
        return (
          <button
            key={device.id}
            onClick={() => setDevicePreviewMode(device.id)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5'
            }`}
            title={`${device.label} View`}
            aria-label={`${device.label} View`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export default DeviceSwitcher;
