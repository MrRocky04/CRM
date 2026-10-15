import { Router } from 'express';
import * as wfController from '../controllers/workflow.controller.js';
import { validate } from '../middleware/validate.js';
import { createWorkflowSchema, updateWorkflowSchema } from '../validators/index.js';
import { authenticateSession, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', wfController.listWorkflows);
router.get('/:id', wfController.getWorkflow);
router.post('/', requireAdmin, validate(createWorkflowSchema), wfController.createWorkflow);
router.patch('/:id', requireAdmin, validate(updateWorkflowSchema), wfController.updateWorkflow);
router.delete('/:id', requireAdmin, wfController.deleteWorkflow);
router.post('/:id/run', requireAdmin, wfController.runWorkflow);

export default router;
