/**
 * @file SidebarItem.jsx
 * @description Accessible navigational sidebar item with active indicator, hover three-dots options dropdown (Rename, Delete).
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export function SidebarItem({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
  collapsed = false,
  onRename,
  onDelete,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(label);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSaveRename = () => {
    setIsEditing(false);
    if (tempName.trim() && tempName.trim() !== label && onRename) {
      onRename(tempName.trim());
    }
  };

  return (
    <div className="relative group/item w-full">
      {isEditing ? (
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/5 theme-dark:bg-white/[0.02] border border-indigo-500/30">
          {Icon && <Icon className="w-4 h-4 shrink-0 text-indigo-500" />}
          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
            className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none py-0.5"
          />
        </div>
      ) : (
        <button
          onClick={(e) => {
            if (isDropdownOpen) return;
            onClick(e);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
            isActive
              ? 'bg-indigo-500/10 theme-dark:bg-indigo-600/30 text-[var(--text-primary)] font-bold border border-indigo-500/30 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/10 theme-dark:hover:bg-white/[0.10] border border-transparent hover:border-black/5 theme-dark:hover:border-white/[0.06]'
          } ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? label : undefined}
          aria-label={label}
        >
          {Icon && (
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-indigo-600 theme-dark:text-indigo-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
              }`}
            />
          )}
          {!collapsed && <span className="truncate flex-1 pr-6 text-left">{label}</span>}
          {!collapsed && badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-700 theme-dark:text-indigo-300 rounded-full border border-indigo-500/30 group-hover/item:hidden transition-all shrink-0">
              {badge}
            </span>
          )}
        </button>
      )}

      {/* Three dots options trigger — only on hover, when not collapsed, when rename/delete handles are supplied */}
      {!collapsed && !isEditing && (onRename || onDelete) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/10 theme-dark:hover:bg-white/10 transition-colors"
            title="Options"
            aria-label="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Settings Overlay Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-1 w-28 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl py-1 z-50 backdrop-blur-xl animate-fade-in"
            >
              {onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                    setIsEditing(true);
                    setTempName(label);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Rename</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-rose-600 theme-dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SidebarItem;
