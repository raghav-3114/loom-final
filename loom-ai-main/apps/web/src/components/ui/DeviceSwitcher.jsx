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
    <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-white/10">
      {devices.map((device) => {
        const Icon = device.icon;
        const isActive = devicePreviewMode === device.id;
        return (
          <button
            key={device.id}
            onClick={() => setDevicePreviewMode(device.id)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
