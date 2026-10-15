import { z } from 'zod';
import { SUPPORTED_PLACEHOLDERS } from '../config/constants.js';

// Helper to validate email template placeholders
export function validateTemplatePlaceholders(text) {
  const matches = text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  const invalid = [];
  for (const match of matches) {
    if (!SUPPORTED_PLACEHOLDERS.includes(match)) {
      invalid.push(match);
    }
  }
  return {
    isValid: invalid.length === 0,
    invalidPlaceholders: invalid
  };
}

export const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  segment: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'totalSpent', 'orderCount', 'lastName', 'lastOrderDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const createCustomerSchema = z.object({
  email: z.string().email('Valid email address required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable()
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable()
});

export const orderQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['dateCreated', 'total', 'orderNumber', 'status']).default('dateCreated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty')
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty')
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  source: z.enum(['MANUAL', 'WORKFLOW', 'ACTION_AGENT']).default('MANUAL')
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['GENERAL', 'WELCOME', 'RETENTION', 'FOLLOW_UP', 'PROMOTION']).default('GENERAL')
}).refine(data => {
  const subjectCheck = validateTemplatePlaceholders(data.subject);
  const bodyCheck = validateTemplatePlaceholders(data.body);
  return subjectCheck.isValid && bodyCheck.isValid;
}, {
  message: 'Template contains unsupported placeholders. Only {{name}} and {{email}} are supported.'
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.enum(['GENERAL', 'WELCOME', 'RETENTION', 'FOLLOW_UP', 'PROMOTION']).optional()
}).refine(data => {
  if (data.subject) {
    const subjectCheck = validateTemplatePlaceholders(data.subject);
    if (!subjectCheck.isValid) return false;
  }
  if (data.body) {
    const bodyCheck = validateTemplatePlaceholders(data.body);
    if (!bodyCheck.isValid) return false;
  }
  return true;
}, {
  message: 'Template contains unsupported placeholders. Only {{name}} and {{email}} are supported.'
});

export const sendEmailSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  recipientEmail: z.string().email('Valid recipient email required'),
  recipientName: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  templateId: z.string().optional().nullable()
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional().nullable(),
  triggerType: z.enum(['INACTIVE_CUSTOMER', 'NEW_ORDER', 'HIGH_VALUE_ORDER', 'ORDER_STATUS_CHANGED']),
  triggerConfig: z.record(z.any()),
  actionType: z.enum(['CREATE_TASK', 'DRAFT_EMAIL', 'SEND_EMAIL']),
  actionConfig: z.record(z.any()),
  enabled: z.boolean().default(false)
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  triggerType: z.enum(['INACTIVE_CUSTOMER', 'NEW_ORDER', 'HIGH_VALUE_ORDER', 'ORDER_STATUS_CHANGED']).optional(),
  triggerConfig: z.record(z.any()).optional(),
  actionType: z.enum(['CREATE_TASK', 'DRAFT_EMAIL', 'SEND_EMAIL']).optional(),
  actionConfig: z.record(z.any()).optional(),
  enabled: z.boolean().optional()
});
