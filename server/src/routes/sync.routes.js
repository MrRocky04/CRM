import { Router } from 'express';
import * as syncController from '../controllers/sync.controller.js';
import { authenticateSession, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/status', syncController.getStatus);
router.post('/woocommerce', requireAdmin, syncController.triggerSync);

export default router;
