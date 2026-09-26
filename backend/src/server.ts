import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { initFirebaseAdmin } from './config/firebase.js';
import { ensureStorageBucket } from './services/storageService.js';
import { initSocketIO } from './socket/socketManager.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { runInactionCheckJob } from './modules/scheduledJobs/cronJobs.js';

const app = express();
const server = http.createServer(app);

// 1. Initialize Services
initFirebaseAdmin();
ensureStorageBucket().catch((err) => logger.warn('Storage bucket check warning:', err));

// 2. Security Middleware (Helmet & CORS)
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost, 127.0.0.1, Vercel deployments, or explicit clientUrl
      if (
        config.nodeEnv === 'development' ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === config.clientUrl ||
        origin === config.socketOrigin ||
        origin.includes('vercel.app') ||
        config.clientUrl === '*'
      ) {
        return callback(null, true);
      }

      const allowed = [config.clientUrl, config.socketOrigin, 'http://localhost:3000', 'http://localhost:3001'];
      if (allowed.includes(origin) || origin.includes('vercel.app')) {
        return callback(null, true);
      }

      callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// 3. Rate Limiter (Allow 200 requests per 15 min window)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', limiter);

// 4. Request Logging & Body Parsers
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Mount Central API Router under /api/v1
app.use('/api/v1', apiRouter);

// 6. Centralized Error Handler
app.use(errorHandler);

// 7. Initialize Socket.IO Server Engine
initSocketIO(server);

// 8. Start HTTP Listener (Only in non-serverless environments)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
  const PORT = config.port;
  server.listen(PORT, () => {
    logger.info(`================================================`);
    logger.info(`🚀 ELAP Backend Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🔑 DEMO_MODE: ${config.demoMode ? 'ENABLED' : 'DISABLED'}`);
    logger.info(`================================================`);

    // Start Background Inaction Check Interval (every 10 minutes)
    const SLA_CHECK_INTERVAL_MS = 10 * 60 * 1000;
    setTimeout(async () => {
      try {
        await runInactionCheckJob();
      } catch (err) {
        logger.error('Initial SLA check error:', err);
      }
    }, 10000);

    setInterval(async () => {
      try {
        await runInactionCheckJob();
      } catch (err) {
        logger.error('Scheduled SLA check error:', err);
      }
    }, SLA_CHECK_INTERVAL_MS);
  });
}

export { app, server };
export default app;
