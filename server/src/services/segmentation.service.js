import { SEGMENTS, DEFAULT_THRESHOLDS } from '../config/constants.js';

export function calculateCustomerSegment(customer, thresholds = DEFAULT_THRESHOLDS) {
  const { orderCount = 0, totalSpent = 0, lastOrderDate } = customer;

  // 1. Inactive check (highest precedence if they have previous order history)
  if (orderCount > 0 && lastOrderDate) {
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastOrder >= thresholds.INACTIVE_DAYS) {
      return SEGMENTS.INACTIVE;
    }
  }

  // 2. Loyal check
  if (orderCount >= thresholds.LOYAL_ORDERS || totalSpent >= thresholds.LOYAL_SPEND) {
    return SEGMENTS.LOYAL;
  }

  // 3. Repeat check
  if (orderCount >= thresholds.REPEAT_ORDERS) {
    return SEGMENTS.REPEAT;
  }

  // 4. Default: New customer
  return SEGMENTS.NEW;
}
