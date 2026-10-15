import React from 'react';
import { Button } from '../ui/Button';

export function EmptyState({
  icon: Icon,
  title = 'No records found',
  description = 'Try adjusting your filters or search criteria.',
  actionText,
  onAction
}) {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
}
