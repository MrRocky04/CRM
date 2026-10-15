import prisma from '../db/prisma.js';

export async function getOrders({
  search = '',
  status,
  customerId,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = 'dateCreated',
  sortOrder = 'desc'
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { orderNumber: { contains: q } },
      { billingName: { contains: q } },
      { billingEmail: { contains: q } },
      { customer: { firstName: { contains: q } } },
      { customer: { lastName: { contains: q } } }
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status.toLowerCase();
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate || endDate) {
    where.dateCreated = {};
    if (startDate) where.dateCreated.gte = new Date(startDate);
    if (endDate) where.dateCreated.lte = new Date(endDate);
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            segment: true
          }
        },
        items: true
      }
    })
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getOrderById(id) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true
    }
  });

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  return order;
}
