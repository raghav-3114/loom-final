/**
 * @file Dropdown.jsx
 * @description Accessible dropdown menu component with customizable options.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function Dropdown({ trigger, items = [], value, onChange, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find((item) => item.value === value);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all shadow-sm focus:outline-none"
        >
          <span>{selectedItem ? selectedItem.label : placeholder}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 py-1 overflow-hidden animate-fade-in backdrop-blur-xl">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                value === item.value
                  ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && <span className="text-[10px] text-slate-400">{item.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
