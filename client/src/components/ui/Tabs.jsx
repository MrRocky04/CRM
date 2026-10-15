import React from 'react';
import { cn } from '../../lib/utils';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn("border-b border-slate-200 overflow-x-auto", className)}>
      <nav className="flex space-x-4 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                isActive
                  ? "border-brand-indigo text-brand-indigo font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                    isActive ? "bg-brand-indigo/10 text-brand-indigo" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
