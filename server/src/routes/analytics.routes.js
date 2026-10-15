import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/overview', analyticsController.getOverview);
router.get('/retention', analyticsController.getRetention);

export default router;
