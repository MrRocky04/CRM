import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeType = 'info',
  className
}) {
  const badgeStyles = {
    info: 'bg-indigo-50 text-brand-indigo',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700'
  };

  return (
    <Card className={cn("p-5 relative overflow-hidden transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Icon className="w-5 h-5 text-brand-indigo" />
          </div>
        )}
      </div>
      {badge && (
        <div className="mt-3">
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", badgeStyles[badgeType])}>
            {badge}
          </span>
        </div>
      )}
    </Card>
  );
}
