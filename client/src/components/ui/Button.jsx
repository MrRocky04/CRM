import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Button({
  children,
  className,
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    default: 'bg-brand-dark text-white hover:bg-brand-hover active:bg-slate-900 shadow-sm',
    indigo: 'bg-brand-indigo text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
    outline: 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    link: 'text-brand-indigo hover:underline p-0 h-auto'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-9 gap-2',
    lg: 'text-base px-5 py-2.5 h-11 gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </button>
  );
}
