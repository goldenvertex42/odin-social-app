import { Router } from 'express';
import passport from 'passport';
import { 
  getAllUsers, 
  getRelationshipState, 
  sendFollowRequest, 
  acceptFollowRequest, 
  removeFollowRelationship,
  updateProfile 
} from './user.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/', requireAuth, getAllUsers);
router.get('/:id/relationship', requireAuth, getRelationshipState);
router.post('/:id/follow', requireAuth, sendFollowRequest);
router.patch('/:id/accept', requireAuth, acceptFollowRequest);
router.delete('/:id/cancel', requireAuth, removeFollowRelationship);

router.put('/profile', requireAuth, updateProfile);

export default router;
