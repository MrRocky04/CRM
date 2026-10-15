import { Router } from 'express';
import * as agentController from '../controllers/agent.controller.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/recommendations', agentController.getStoreRecommendations);
router.get('/recommendations/:customerId', agentController.getCustomerRecommendations);
router.post('/query', agentController.queryAgent);

export default router;
