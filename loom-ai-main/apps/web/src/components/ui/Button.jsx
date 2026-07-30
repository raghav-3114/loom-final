/**
 * @file Button.jsx
 * @description Premium reusable button component supporting primary gradient, glass, ghost, outline, and icon variants.
 */

import React from 'react';

/**
 * Reusable Button component
 * @param {Object} props
 * @param {'primary'|'glass'|'ghost'|'outline'|'secondary'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.className='']
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 border border-indigo-400/30',
    glass: 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 border border-white/10 backdrop-blur-md hover:border-white/20 shadow-md',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 shadow-sm',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white',
    outline: 'border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
