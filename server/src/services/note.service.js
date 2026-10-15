import prisma from '../db/prisma.js';

export async function getNotesByCustomer(customerId) {
  return prisma.customerNote.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createNote(customerId, content, user) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.customerNote.create({
    data: {
      customerId,
      authorId: user?.id || null,
      authorName: user?.name || 'CRM User',
      content: content.trim()
    }
  });
}

export async function updateNote(noteId, content) {
  const note = await prisma.customerNote.findUnique({
    where: { id: noteId }
  });

  if (!note) {
    const err = new Error('Note not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.customerNote.update({
    where: { id: noteId },
    data: { content: content.trim() }
  });
}

export async function deleteNote(noteId) {
  const note = await prisma.customerNote.findUnique({
    where: { id: noteId }
  });

  if (!note) {
    const err = new Error('Note not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.customerNote.delete({
    where: { id: noteId }
  });

  return { success: true };
}
