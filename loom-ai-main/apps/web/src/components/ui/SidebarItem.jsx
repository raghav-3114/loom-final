/**
 * @file SidebarItem.jsx
 * @description Accessible navigational sidebar item with active indicator and icon.
 */

import React from 'react';

export function SidebarItem({ icon: Icon, label, isActive = false, onClick, badge, collapsed = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/30 shadow-md'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
      } ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      {Icon && <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />}
      {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
      {!collapsed && badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          {badge}
        </span>
      )}
    </button>
  );
}

export default SidebarItem;
