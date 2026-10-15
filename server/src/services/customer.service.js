import prisma from '../db/prisma.js';
import { calculateCustomerSegment } from './segmentation.service.js';
import { QUALIFYING_ORDER_STATUSES } from '../config/constants.js';

export async function getCustomers({
  search = '',
  segment,
  source,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } }
    ];
  }

  if (segment && segment !== 'ALL') {
    where.segment = segment;
  }

  if (source && source !== 'ALL') {
    where.source = source;
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            orders: true,
            notes: true,
            tasks: { where: { status: { not: 'COMPLETED' } } }
          }
        }
      }
    })
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getCustomerById(id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { dateCreated: 'desc' },
        include: { items: true }
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      },
      tasks: {
        orderBy: { createdAt: 'desc' }
      },
      communications: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  const qualifyingOrders = customer.orders.filter(o => 
    QUALIFYING_ORDER_STATUSES.includes(o.status.toLowerCase())
  );

  const averageOrderValue = qualifyingOrders.length > 0 
    ? customer.totalSpent / qualifyingOrders.length 
    : 0;

  const daysSinceLastOrder = customer.lastOrderDate 
    ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    ...customer,
    metrics: {
      averageOrderValue,
      daysSinceLastOrder,
      qualifyingOrderCount: qualifyingOrders.length,
      pendingTaskCount: customer.tasks.filter(t => t.status !== 'COMPLETED').length
    }
  };
}

export async function createCrmCustomer(data) {
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.customer.findUnique({
    where: { email }
  });

  if (existing) {
    const err = new Error(`A customer with email ${email} already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      billingAddress: data.billingAddress || null,
      shippingAddress: data.shippingAddress || null,
      source: 'CRM',
      segment: 'New',
      totalSpent: 0,
      orderCount: 0
    }
  });

  return customer;
}

export async function updateCustomer(id, data) {
  const existing = await prisma.customer.findUnique({
    where: { id }
  });

  if (!existing) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  // Protect WooCommerce-owned fields from accidental overwrites:
  // If sourced from WooCommerce, protect woocommerceId
  const updateData = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
  if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress;
  if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData
  });

  return updated;
}

export async function recalculateCustomerMetrics(customerId) {
  const orders = await prisma.order.findMany({
    where: { customerId }
  });

  const qualifyingOrders = orders.filter(o => 
    QUALIFYING_ORDER_STATUSES.includes(o.status.toLowerCase())
  );

  const orderCount = qualifyingOrders.length;
  const totalSpent = qualifyingOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  let lastOrderDate = null;
  if (qualifyingOrders.length > 0) {
    const sorted = [...qualifyingOrders].sort((a, b) => 
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
    lastOrderDate = sorted[0].dateCreated;
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;

  const segment = calculateCustomerSegment({
    orderCount,
    totalSpent,
    lastOrderDate
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      orderCount,
      totalSpent,
      lastOrderDate,
      segment
    }
  });
}
