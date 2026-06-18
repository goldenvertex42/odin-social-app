import { Router } from 'express';
import passport from 'passport';
import { upload } from '../../middleware/upload.js';
import { 
  getSocialFeed, 
  createPost,
  updatePost,
  deletePost } from './post.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Feed retrieval endpoints
router.get('/feed', requireAuth, getSocialFeed);

// Content mutation endpoints
router.post('/', requireAuth, upload.single('image'),createPost);
router.put('/:postId', requireAuth, upload.single('image'), updatePost);
router.delete('/:postId', requireAuth, deletePost);

export default router;
