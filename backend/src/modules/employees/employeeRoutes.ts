import { Router } from 'express';
import { getProfile, getTeamMembers, createEmployee } from './employeeController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { rbacMiddleware } from '../../middleware/rbacMiddleware.js';
import { Role } from '../../types/enums.js';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/team', authMiddleware, rbacMiddleware([Role.MANAGER, Role.HR]), getTeamMembers);
router.post('/', authMiddleware, rbacMiddleware([Role.MANAGER, Role.HR]), createEmployee);

export default router;

