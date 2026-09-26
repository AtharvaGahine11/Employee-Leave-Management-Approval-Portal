import { Router } from 'express';
import {
  getManagerLeaves,
  managerApprove,
  managerReject,
  getHrLeaves,
  hrApprove,
  hrReject,
} from './approvalController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { rbacMiddleware } from '../../middleware/rbacMiddleware.js';
import { Role } from '../../types/enums.js';

const router = Router();

// Manager Routes (Tier 1)
router.get('/manager/leaves', authMiddleware, rbacMiddleware([Role.MANAGER, Role.HR]), getManagerLeaves);
router.post('/manager/leaves/:id/approve', authMiddleware, rbacMiddleware([Role.MANAGER, Role.HR]), managerApprove);
router.post('/manager/leaves/:id/reject', authMiddleware, rbacMiddleware([Role.MANAGER, Role.HR]), managerReject);

// HR Routes (Tier 2)
router.get('/hr/leaves', authMiddleware, rbacMiddleware([Role.HR]), getHrLeaves);
router.post('/hr/leaves/:id/approve', authMiddleware, rbacMiddleware([Role.HR]), hrApprove);
router.post('/hr/leaves/:id/reject', authMiddleware, rbacMiddleware([Role.HR]), hrReject);

export default router;
