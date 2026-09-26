import { Router } from 'express';
import {
  createLeaveRequest,
  getEmployeeLeaves,
  getLeaveBalances,
  getLeaveDetails,
  submitDraftRequest,
  cancelLeaveRequest,
} from './leaveController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createLeaveRequest);
router.get('/', authMiddleware, getEmployeeLeaves);
router.get('/balances', authMiddleware, getLeaveBalances);
router.get('/:id', authMiddleware, getLeaveDetails);
router.post('/:id/submit', authMiddleware, submitDraftRequest);
router.post('/:id/cancel', authMiddleware, cancelLeaveRequest);

export default router;
