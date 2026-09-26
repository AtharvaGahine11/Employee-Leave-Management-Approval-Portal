import { Router } from 'express';
import { getRequestComments, addComment, searchComments } from './commentController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/comments/search', authMiddleware, searchComments);
router.get('/leaves/:id/comments', authMiddleware, getRequestComments);
router.post('/leaves/:id/comments', authMiddleware, addComment);

export default router;
