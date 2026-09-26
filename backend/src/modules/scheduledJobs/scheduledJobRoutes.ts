import { Router, Request, Response } from 'express';
import { runInactionCheckJob, simulateAgingForDemo } from './cronJobs.js';
import { config } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to authorize either via cron secret OR HR JWT token
const authorizeCronOrHr = (req: Request, res: Response, next: Function) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (config.cronSecret && secret === config.cronSecret) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      if (decoded.role === 'HR') {
        req.user = decoded;
        return next();
      }
    } catch (e) {
      // Invalid token
    }
  }

  throw new AppError('Unauthorized execution attempt. Requires HR role or valid cron secret.', 401, 'UNAUTHORIZED');
};

router.post(
  '/cron/sla-check',
  authorizeCronOrHr,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await runInactionCheckJob();

    res.status(200).json({
      success: true,
      message: `SLA check completed: ${result.reminderCount} reminders sent, ${result.escalationCount} requests escalated.`,
      data: result,
    });
  })
);

router.post(
  '/cron/simulate-aging',
  authorizeCronOrHr,
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId, hours = 49 } = req.body;

    if (!requestId) {
      throw new AppError('requestId is required for aging simulation.', 400, 'INVALID_INPUT');
    }

    const updated = await simulateAgingForDemo(requestId, Number(hours));

    res.status(200).json({
      success: true,
      message: `Successfully aged request ${requestId} by ${hours} hours for demo testing.`,
      data: updated,
    });
  })
);

export default router;
