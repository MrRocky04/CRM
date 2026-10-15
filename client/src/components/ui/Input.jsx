import React from 'react';
import { cn } from '../../lib/utils';

export function Input({
  label,
  error,
  className,
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={cn(
          "w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  id,
  rows = 3,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  className,
  id,
  children,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all cursor-pointer",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-200",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
