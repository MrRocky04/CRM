import prisma from '../db/prisma.js';

export async function getTasks({ customerId, status, priority } = {}) {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (status && status !== 'ALL') {
    if (status === 'OVERDUE') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { lt: new Date() };
    } else {
      where.status = status;
    }
  }

  if (priority && priority !== 'ALL') {
    where.priority = priority;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ],
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          segment: true
        }
      }
    }
  });

  const now = new Date();
  return tasks.map(task => ({
    ...task,
    isOverdue: task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < now
  }));
}

export async function createTask(data) {
  if (data.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });
    if (!customer) {
      const err = new Error('Associated customer not found');
      err.statusCode = 404;
      throw err;
    }
  }

  return prisma.task.create({
    data: {
      title: data.title.trim(),
      description: data.description || null,
      customerId: data.customerId || null,
      assignedToId: data.assignedToId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      source: data.source || 'MANUAL'
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}

export async function updateTask(id, data) {
  const existing = await prisma.task.findUnique({
    where: { id }
  });

  if (!existing) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (data.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }
  }

  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}

export async function deleteTask(id) {
  const existing = await prisma.task.findUnique({
    where: { id }
  });

  if (!existing) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.task.delete({ where: { id } });
  return { success: true };
}
