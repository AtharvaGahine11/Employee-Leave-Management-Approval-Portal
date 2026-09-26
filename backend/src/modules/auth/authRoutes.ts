import { Router } from 'express';
import { login, register, firebaseLogin, getSession, changePassword } from './authController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/firebase-login', firebaseLogin);
router.get('/session', authMiddleware, getSession);
router.post('/change-password', authMiddleware, changePassword);

export default router;

