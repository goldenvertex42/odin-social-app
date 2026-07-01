import { Router } from 'express';
import passport from 'passport';
import { togglePostLike, toggleCommentLike } from './like.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.post('/post/:postId', requireAuth, togglePostLike);
router.post('/comment/:commentId', requireAuth, toggleCommentLike);

export default router;
