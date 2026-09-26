import { initializeApp, cert, type App, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseAdminApp: App | null = null;

export const initFirebaseAdmin = (): App | null => {
  if (firebaseAdminApp) return firebaseAdminApp;

  try {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      if (getApps().length === 0) {
        firebaseAdminApp = initializeApp({
          credential: cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        firebaseAdminApp = getApps()[0];
      }
      logger.info('🔥 Firebase Admin SDK initialized successfully');
    } else {
      logger.warn('⚠️ Firebase Admin credentials missing. Running in DEMO_MODE fallback for authentication.');
    }
  } catch (error) {
    logger.warn('⚠️ Firebase Admin initialization failed. Fallback auth will be used.', error);
  }

  return firebaseAdminApp;
};

export const getFirebaseAdmin = () => {
  if (!firebaseAdminApp) return null;
  return {
    app: firebaseAdminApp,
    auth: () => getAuth(firebaseAdminApp!),
  };
};

