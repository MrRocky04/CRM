import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema } from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', taskController.listTasks);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;
