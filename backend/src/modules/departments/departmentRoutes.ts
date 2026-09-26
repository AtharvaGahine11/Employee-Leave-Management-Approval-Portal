import { Router } from 'express';
import { getDepartments } from './departmentController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/', getDepartments);

export default router;
