import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={cn("w-full text-left text-sm text-slate-600 border-collapse", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn("bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn("divide-y divide-slate-100", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr className={cn("hover:bg-slate-50/60 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn("px-4 py-3.5 tracking-wider", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn("px-4 py-3.5 text-slate-700 align-middle", className)} {...props}>
      {children}
    </td>
  );
}
