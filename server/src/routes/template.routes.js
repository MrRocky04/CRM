import { Router } from 'express';
import * as templateController from '../controllers/template.controller.js';
import { validate } from '../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', templateController.listTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/', validate(createTemplateSchema), templateController.createTemplate);
router.patch('/:id', validate(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;
