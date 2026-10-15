import * as emailService from '../services/email.service.js';

export async function listCommunications(req, res, next) {
  try {
    const communications = await emailService.getCommunications({
      customerId: req.query.customerId,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50
    });
    res.json({ communications });
  } catch (err) {
    next(err);
  }
}

export async function previewCommunication(req, res, next) {
  try {
    const preview = await emailService.previewEmail({
      customerId: req.body.customerId,
      templateId: req.body.templateId,
      customSubject: req.body.subject,
      customBody: req.body.body
    });
    res.json(preview);
  } catch (err) {
    next(err);
  }
}

export async function sendCommunication(req, res, next) {
  try {
    const communication = await emailService.sendEmail(req.body);
    res.status(201).json({
      message: 'Email processed for delivery',
      communication
    });
  } catch (err) {
    next(err);
  }
}
