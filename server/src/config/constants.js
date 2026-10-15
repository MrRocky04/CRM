export const SEGMENTS = {
  NEW: 'New',
  REPEAT: 'Repeat',
  LOYAL: 'Loyal',
  INACTIVE: 'Inactive'
};

export const DEFAULT_THRESHOLDS = {
  INACTIVE_DAYS: parseInt(process.env.INACTIVE_DAYS_THRESHOLD || '60', 10),
  LOYAL_ORDERS: parseInt(process.env.LOYAL_ORDER_COUNT_THRESHOLD || '5', 10),
  LOYAL_SPEND: 500.0,
  REPEAT_ORDERS: parseInt(process.env.REPEAT_ORDER_COUNT_THRESHOLD || '2', 10)
};

// Explicit qualifying WooCommerce order statuses for retention calculations and AOV
export const QUALIFYING_ORDER_STATUSES = ['completed', 'processing'];

export const SUPPORTED_PLACEHOLDERS = ['{{name}}', '{{email}}'];

export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export const COMMUNICATION_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
  COMPLAINED: 'COMPLAINED'
};
