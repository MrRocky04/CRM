import * as webhookService from '../services/webhook.service.js';

export async function handleWooCommerce(req, res, next) {
  try {
    const topic = req.headers['x-wc-webhook-topic'] || 'unknown';
    const deliveryId = req.headers['x-wc-webhook-delivery-id'];
    const signature = req.headers['x-wc-webhook-signature'];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const result = await webhookService.processWooCommerceWebhook({
      topic,
      deliveryId,
      rawBody,
      signature,
      payload: req.body
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('WooCommerce webhook error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

export async function handleResend(req, res, next) {
  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const result = await webhookService.processResendWebhook({
      rawBody,
      headers: req.headers,
      payload: req.body
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Resend webhook error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
