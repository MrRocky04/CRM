import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { recalculateCustomerMetrics } from './customer.service.js';

export function verifyWooCommerceSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  const computedBuf = Buffer.from(computed);
  const sigBuf = Buffer.from(signature);
  if (computedBuf.length !== sigBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(computedBuf, sigBuf);
}

export async function processWooCommerceWebhook({ topic, deliveryId, rawBody, signature, payload }) {
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

  // 1. Signature Verification
  if (secret && signature) {
    const isValid = verifyWooCommerceSignature(rawBody, signature, secret);
    if (!isValid) {
      const err = new Error('Invalid WooCommerce webhook signature.');
      err.statusCode = 401;
      throw err;
    }
  }

  // 2. Idempotency Check
  const idempotencyKey = deliveryId 
    ? `woo_deliv_${deliveryId}` 
    : `woo_${topic}_${crypto.createHash('md5').update(rawBody).digest('hex')}`;

  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey }
  });

  if (existingEvent) {
    return {
      status: 'IGNORED_DUPLICATE',
      message: 'Webhook delivery already processed previously.'
    };
  }

  const webhookRecord = await prisma.webhookEvent.create({
    data: {
      source: 'WOOCOMMERCE',
      eventType: topic || 'unknown',
      idempotencyKey,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      status: 'PROCESSED'
    }
  });

  // 3. Process Payload Based on Topic
  try {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

    if (topic.startsWith('customer.')) {
      const email = (data.email || '').toLowerCase().trim();
      if (email && data.id) {
        await prisma.customer.upsert({
          where: { woocommerceId: data.id },
          update: {
            firstName: data.first_name || 'Customer',
            lastName: data.last_name || '',
            phone: data.billing?.phone || null,
            billingAddress: JSON.stringify(data.billing || {}),
            shippingAddress: JSON.stringify(data.shipping || {})
          },
          create: {
            woocommerceId: data.id,
            email,
            firstName: data.first_name || 'Customer',
            lastName: data.last_name || '',
            phone: data.billing?.phone || null,
            source: 'WOOCOMMERCE',
            billingAddress: JSON.stringify(data.billing || {}),
            shippingAddress: JSON.stringify(data.shipping || {})
          }
        });
      }
    } else if (topic.startsWith('order.')) {
      if (data.id) {
        let customer = null;
        if (data.customer_id && data.customer_id > 0) {
          customer = await prisma.customer.findUnique({
            where: { woocommerceId: data.customer_id }
          });
        }
        if (!customer && data.billing?.email) {
          customer = await prisma.customer.findUnique({
            where: { email: data.billing.email.toLowerCase().trim() }
          });
        }

        const order = await prisma.order.upsert({
          where: { woocommerceId: data.id },
          update: {
            orderNumber: String(data.number || data.id),
            customerId: customer?.id || null,
            status: data.status || 'completed',
            total: parseFloat(data.total || 0),
            subtotal: parseFloat(data.subtotal || 0),
            currency: data.currency || 'USD',
            paymentMethodTitle: data.payment_method_title || null,
            dateModified: new Date()
          },
          create: {
            woocommerceId: data.id,
            orderNumber: String(data.number || data.id),
            customerId: customer?.id || null,
            status: data.status || 'completed',
            total: parseFloat(data.total || 0),
            subtotal: parseFloat(data.subtotal || 0),
            currency: data.currency || 'USD',
            paymentMethodTitle: data.payment_method_title || null,
            dateCreated: new Date(data.date_created_gmt || Date.now())
          }
        });

        if (customer) {
          await recalculateCustomerMetrics(customer.id);
        }
      }
    }

    return { status: 'PROCESSED', eventId: webhookRecord.id };
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        status: 'FAILED',
        errorMessage: err.message
      }
    });
    throw err;
  }
}

export async function processResendWebhook({ rawBody, headers, payload }) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

  const eventType = event.type || 'email.sent';
  const emailId = event.data?.email_id;

  const idempotencyKey = `resend_${eventType}_${emailId}_${event.created_at || Date.now()}`;

  const existing = await prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return { status: 'IGNORED_DUPLICATE' };
  }

  await prisma.webhookEvent.create({
    data: {
      source: 'RESEND',
      eventType,
      idempotencyKey,
      payload: JSON.stringify(event),
      status: 'PROCESSED'
    }
  });

  if (emailId) {
    let newStatus = null;
    let deliveredAt = null;

    if (eventType === 'email.delivered') {
      newStatus = 'DELIVERED';
      deliveredAt = new Date();
    } else if (eventType === 'email.bounced') {
      newStatus = 'BOUNCED';
    } else if (eventType === 'email.complained') {
      newStatus = 'COMPLAINED';
    }

    if (newStatus) {
      await prisma.communication.updateMany({
        where: { providerMessageId: emailId },
        data: {
          status: newStatus,
          ...(deliveredAt && { deliveredAt })
        }
      });
    }
  }

  return { status: 'PROCESSED' };
}
