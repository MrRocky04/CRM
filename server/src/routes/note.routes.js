import { Router } from 'express';
import * as noteController from '../controllers/note.controller.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/customer/:customerId', noteController.listNotes);
router.post('/customer/:customerId', validate(createNoteSchema), noteController.createNote);
router.patch('/:id', validate(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
