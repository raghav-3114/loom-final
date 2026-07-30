/**
 * @file Tabs.jsx
 * @description Accessible tab navigation component with active state pill styling.
 */

import React from 'react';

export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/10 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
