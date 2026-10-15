import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { validate } from '../middleware/validate.js';
import { 
  customerQuerySchema, 
  createCustomerSchema, 
  updateCustomerSchema 
} from '../validators/index.js';
import { authenticateSession, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateSession, requireAuth);

router.get('/', validate(customerQuerySchema, 'query'), customerController.listCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', validate(createCustomerSchema), customerController.createCustomer);
router.patch('/:id', validate(updateCustomerSchema), customerController.updateCustomer);

export default router;
