import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Alert({ variant = 'info', title, children, className }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    destructive: 'bg-rose-50 border-rose-200 text-rose-900'
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
  };

  return (
    <div className={cn("p-4 rounded-xl border flex items-start gap-3", styles[variant], className)} role="alert">
      {icons[variant]}
      <div className="text-xs sm:text-sm leading-relaxed">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        {children}
      </div>
    </div>
  );
}
