import { Router } from 'express';
import { getAuditLogs, getRequestAuditLogs, exportAuditLogsCSV } from './auditController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { rbacMiddleware } from '../../middleware/rbacMiddleware.js';
import { Role } from '../../types/enums.js';

const router = Router();

router.get('/hr/audit', authMiddleware, rbacMiddleware([Role.HR]), getAuditLogs);
router.get('/hr/audit/export', authMiddleware, rbacMiddleware([Role.HR]), exportAuditLogsCSV);
router.get('/leaves/:id/audit', authMiddleware, getRequestAuditLogs);

export default router;
