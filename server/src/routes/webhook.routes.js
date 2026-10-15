import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

const router = Router();

router.post('/woocommerce', webhookController.handleWooCommerce);
router.post('/resend', webhookController.handleResend);

export default router;
