import { Router } from 'express';
import authRoutes from '../modules/auth/authRoutes.js';
import employeeRoutes from '../modules/employees/employeeRoutes.js';
import departmentRoutes from '../modules/departments/departmentRoutes.js';
import leaveRoutes from '../modules/leaves/leaveRoutes.js';
import approvalRoutes from '../modules/approvals/approvalRoutes.js';
import commentRoutes from '../modules/comments/commentRoutes.js';
import attachmentRoutes from '../modules/attachments/attachmentRoutes.js';
import reportRoutes from '../modules/reports/reportRoutes.js';
import auditRoutes from '../modules/audit/auditRoutes.js';
import notificationRoutes from '../modules/notifications/notificationRoutes.js';
import scheduledJobRoutes from '../modules/scheduledJobs/scheduledJobRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    system: 'ELAP API Backend',
    timestamp: new Date().toISOString(),
  });
});

// API v1 Routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/', approvalRoutes);
router.use('/', commentRoutes);
router.use('/', attachmentRoutes);
router.use('/reports', reportRoutes);
router.use('/', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', scheduledJobRoutes);

export default router;
