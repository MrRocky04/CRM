import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { validate } from '../middleware/validate.js';
import { orderQuerySchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', validate(orderQuerySchema, 'query'), orderController.listOrders);
router.get('/:id', orderController.getOrder);

export default router;
