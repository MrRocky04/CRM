import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export function formatDate(dateString, pattern = 'MMM d, yyyy') {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(d, pattern);
  } catch {
    return String(dateString);
  }
}

export function formatRelative(dateString) {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function getSegmentBadge(segment) {
  switch (segment) {
    case 'Loyal':
      return {
        label: 'Loyal',
        className: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    case 'Repeat':
      return {
        label: 'Repeat',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'Inactive':
      return {
        label: 'Inactive',
        className: 'bg-amber-100 text-amber-800 border-amber-200'
      };
    case 'New':
    default:
      return {
        label: 'New',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
  }
}

export function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'completed':
    case 'delivered':
    case 'success':
      return {
        label: status,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    case 'processing':
    case 'in_progress':
    case 'accepted':
      return {
        label: status,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 'pending':
    case 'on-hold':
    case 'draft':
      return {
        label: status,
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    case 'failed':
    case 'cancelled':
    case 'refunded':
    case 'bounced':
      return {
        label: status,
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    default:
      return {
        label: status || 'unknown',
        className: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}
