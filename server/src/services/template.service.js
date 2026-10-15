import prisma from '../db/prisma.js';
import { validateTemplatePlaceholders } from '../validators/index.js';

export async function getTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function getTemplateById(id) {
  const template = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }

  return template;
}

export function renderTemplateContent(text, { name = '', email = '' } = {}) {
  if (!text) return '';
  return text
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{email\}\}/g, email);
}

export async function createTemplate(data) {
  const subjectValidation = validateTemplatePlaceholders(data.subject);
  const bodyValidation = validateTemplatePlaceholders(data.body);

  if (!subjectValidation.isValid || !bodyValidation.isValid) {
    const invalid = [...subjectValidation.invalidPlaceholders, ...bodyValidation.invalidPlaceholders];
    const err = new Error(`Unsupported placeholders detected: ${invalid.join(', ')}. Only {{name}} and {{email}} are permitted.`);
    err.statusCode = 400;
    throw err;
  }

  return prisma.emailTemplate.create({
    data: {
      name: data.name.trim(),
      subject: data.subject.trim(),
      body: data.body.trim(),
      description: data.description || null,
      category: data.category || 'GENERAL'
    }
  });
}

export async function updateTemplate(id, data) {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.subject) {
    const v = validateTemplatePlaceholders(data.subject);
    if (!v.isValid) {
      const err = new Error(`Unsupported placeholders in subject: ${v.invalidPlaceholders.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.body) {
    const v = validateTemplatePlaceholders(data.body);
    if (!v.isValid) {
      const err = new Error(`Unsupported placeholders in body: ${v.invalidPlaceholders.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.subject && { subject: data.subject.trim() }),
      ...(data.body && { body: data.body.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category && { category: data.category })
    }
  });
}

export async function deleteTemplate(id) {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.emailTemplate.delete({ where: { id } });
  return { success: true };
}
