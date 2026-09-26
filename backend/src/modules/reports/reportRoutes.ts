import { Router } from 'express';
import { getLeaveSummaryReport, exportLeavesCSV } from './reportController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { rbacMiddleware } from '../../middleware/rbacMiddleware.js';
import { Role } from '../../types/enums.js';

const router = Router();

router.get('/leaves', authMiddleware, rbacMiddleware([Role.HR]), getLeaveSummaryReport);
router.get('/leaves/export', authMiddleware, rbacMiddleware([Role.HR]), exportLeavesCSV);

export default router;
