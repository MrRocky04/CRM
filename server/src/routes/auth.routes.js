import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateSession, requireAuth, authController.me);
router.get('/csrf', authController.getCsrfToken);

export default router;
