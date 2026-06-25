import { Router } from 'express';
import passport from 'passport';
import { upload } from '../../middleware/upload.js';
import { 
  getSocialFeed,
  getUserPosts,
  getSinglePost, 
  createPost,
  updatePost,
  deletePost } from './post.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Feed retrieval endpoints
router.get('/feed', requireAuth, getSocialFeed);
router.get('/user/:id', requireAuth, getUserPosts);
router.get('/:postId', requireAuth, getSinglePost);

// Content mutation endpoints
router.post('/', requireAuth, upload.single('image'),createPost);
router.put('/:postId', requireAuth, upload.single('image'), updatePost);
router.delete('/:postId', requireAuth, deletePost);

export default router;
