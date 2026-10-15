import prisma from '../db/prisma.js';
import { QUALIFYING_ORDER_STATUSES } from '../config/constants.js';

export async function getDashboardOverview() {
  const [
    customerCount,
    totalOrdersCount,
    qualifyingOrders,
    segmentCounts,
    pendingTasksCount,
    overdueTasksCount,
    recentOrders,
    recentCommunications,
    syncState
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: { in: QUALIFYING_ORDER_STATUSES } },
      select: { total: true }
    }),
    prisma.customer.groupBy({
      by: ['segment'],
      _count: { id: true }
    }),
    prisma.task.count({ where: { status: { not: 'COMPLETED' } } }),
    prisma.task.count({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() }
      }
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { dateCreated: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, segment: true }
        }
      }
    }),
    prisma.communication.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    }),
    prisma.syncState.findFirst({
      where: { syncType: 'WOOCOMMERCE_FULL' }
    })
  ]);

  const totalQualifyingRevenue = qualifyingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageOrderValue = qualifyingOrders.length > 0 
    ? totalQualifyingRevenue / qualifyingOrders.length 
    : 0;

  // Segment map
  const segments = {
    New: 0,
    Repeat: 0,
    Loyal: 0,
    Inactive: 0
  };
  for (const sc of segmentCounts) {
    if (segments[sc.segment] !== undefined) {
      segments[sc.segment] = sc._count.id;
    }
  }

  return {
    metrics: {
      totalCustomers: customerCount,
      totalOrders: totalOrdersCount,
      qualifyingOrdersCount: qualifyingOrders.length,
      totalOrderValue: totalQualifyingRevenue, // Honesty note: Gross sales, not profit
      averageOrderValue,
      pendingTasks: pendingTasksCount,
      overdueTasks: overdueTasksCount
    },
    segmentDistribution: segments,
    recentOrders,
    recentCommunications,
    syncStatus: {
      status: syncState?.status || 'IDLE',
      lastSyncCompletedAt: syncState?.lastSyncCompletedAt || null,
      recordsProcessed: syncState?.recordsProcessed || 0,
      lastError: syncState?.lastError || null
    }
  };
}

export async function getRetentionAnalytics(timeRange = '90d') {
  let startDate = new Date();
  if (timeRange === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (timeRange === '90d') {
    startDate.setDate(startDate.getDate() - 90);
  } else if (timeRange === '1y') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    // all time
    startDate = new Date(0);
  }

  const [customers, qualifyingOrders, allOrdersInRange] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        segment: true,
        orderCount: true,
        totalSpent: true,
        createdAt: true,
        lastOrderDate: true
      }
    }),
    prisma.order.findMany({
      where: {
        dateCreated: { gte: startDate },
        status: { in: QUALIFYING_ORDER_STATUSES }
      },
      orderBy: { dateCreated: 'asc' },
      select: {
        dateCreated: true,
        total: true,
        customerId: true
      }
    }),
    prisma.order.count({
      where: { dateCreated: { gte: startDate } }
    })
  ]);

  // Aggregate time series (by week or month depending on range)
  const timeBuckets = {};
  for (const order of qualifyingOrders) {
    const d = new Date(order.dateCreated);
    // Bucket key: YYYY-MM-DD or YYYY-MM
    const key = timeRange === '1y' || timeRange === 'all'
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!timeBuckets[key]) {
      timeBuckets[key] = { date: key, orders: 0, revenue: 0 };
    }
    timeBuckets[key].orders += 1;
    timeBuckets[key].revenue += (order.total || 0);
  }

  const trendData = Object.values(timeBuckets).sort((a, b) => a.date.localeCompare(b.date));

  // Customer segment counts
  const segmentBreakdown = {
    New: customers.filter(c => c.segment === 'New').length,
    Repeat: customers.filter(c => c.segment === 'Repeat').length,
    Loyal: customers.filter(c => c.segment === 'Loyal').length,
    Inactive: customers.filter(c => c.segment === 'Inactive').length
  };

  const totalCustomersWithOrders = customers.filter(c => c.orderCount > 0).length;
  const repeatCustomersCount = customers.filter(c => c.orderCount >= 2).length;
  const repeatPurchaseRate = totalCustomersWithOrders > 0
    ? (repeatCustomersCount / totalCustomersWithOrders) * 100
    : 0;

  const totalQualifyingRevenue = qualifyingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const aov = qualifyingOrders.length > 0 ? totalQualifyingRevenue / qualifyingOrders.length : 0;

  return {
    timeRange,
    totalOrdersInRange: allOrdersInRange,
    qualifyingOrdersInRange: qualifyingOrders.length,
    revenueInRange: totalQualifyingRevenue,
    averageOrderValue: aov,
    repeatPurchaseRate: Number(repeatPurchaseRate.toFixed(1)),
    segmentBreakdown,
    trendData,
    disclosures: {
      revenueType: 'Gross qualifying order value (status: completed/processing), not accounting profit.',
      qualifyingStatuses: QUALIFYING_ORDER_STATUSES
    }
  };
}
