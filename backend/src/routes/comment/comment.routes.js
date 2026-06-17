import { Router } from 'express';
import passport from 'passport';
import { 
  createComment, 
  getPostComments,
  updateComment,
  deleteComment } from './comment.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Match standard REST syntax patterns
router.get('/post/:postId', requireAuth, getPostComments);
router.post('/post/:postId', requireAuth, createComment);

router.put('/:commentId', requireAuth, updateComment);
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
