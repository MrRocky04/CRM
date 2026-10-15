import { Router } from 'express';
import * as commController from '../controllers/communication.controller.js';
import { validate } from '../middleware/validate.js';
import { sendEmailSchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', commController.listCommunications);
router.post('/preview', commController.previewCommunication);
router.post('/send', validate(sendEmailSchema), commController.sendCommunication);

export default router;
