import { Router } from 'express';
import passport from 'passport';
import { 
  getSocialFeed, 
  createPost,
  updatePost,
  deletePost } from './post.controller';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Feed retrieval endpoints
router.get('/feed', requireAuth, getSocialFeed);

// Content mutation endpoints
router.post('/', requireAuth, createPost);
router.put('/:postId', requireAuth, updatePost);
router.delete('/:postId', requireAuth, deletePost);

export default router;
