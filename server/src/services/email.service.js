import { Resend } from 'resend';
import prisma from '../db/prisma.js';
import { renderTemplateContent } from './template.service.js';

let resendClient = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_sample') || apiKey === 'your_resend_api_key_here') {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function previewEmail({ customerId, templateId, customSubject, customBody }) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  let subject = customSubject || '';
  let body = customBody || '';

  if (templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });
    if (template) {
      subject = template.subject;
      body = template.body;
    }
  }

  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const renderedSubject = renderTemplateContent(subject, { name: fullName, email: customer.email });
  const renderedBody = renderTemplateContent(body, { name: fullName, email: customer.email });

  return {
    customer: {
      id: customer.id,
      name: fullName,
      email: customer.email
    },
    subject: renderedSubject,
    body: renderedBody,
    recipientEmail: customer.email
  };
}

export async function sendEmail({
  customerId,
  recipientEmail,
  recipientName,
  subject,
  body,
  templateId
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  const client = getResendClient();
  const fromAddress = process.env.EMAIL_FROM || 'Merqanta <notifications@example.com>';

  let providerMessageId = null;
  let status = 'ACCEPTED';
  let errorMessage = null;

  if (client) {
    try {
      const response = await client.emails.send({
        from: fromAddress,
        to: recipientEmail,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; line-height: 1.6; color: #111844;">
          <p>${body.replace(/\n/g, '<br/>')}</p>
        </div>`
      });

      if (response.error) {
        status = 'FAILED';
        errorMessage = response.error.message || 'Resend delivery failed';
      } else {
        providerMessageId = response.data?.id || null;
        status = 'ACCEPTED'; // Resend accepted message for delivery
      }
    } catch (err) {
      status = 'FAILED';
      errorMessage = err.message || 'Email dispatch error';
    }
  } else {
    // Development / Simulated mode
    providerMessageId = `mock_resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    status = 'ACCEPTED';
  }

  const communication = await prisma.communication.create({
    data: {
      customerId,
      recipientEmail,
      recipientName: recipientName || `${customer.firstName} ${customer.lastName}`.trim(),
      subject,
      body,
      templateId: templateId || null,
      status,
      provider: 'RESEND',
      providerMessageId,
      errorMessage,
      sentAt: new Date()
    }
  });

  return communication;
}

export async function getCommunications({ customerId, limit = 50 }) {
  const where = customerId ? { customerId } : {};
  return prisma.communication.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
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
