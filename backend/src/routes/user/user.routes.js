import { Router } from 'express';
import passport from 'passport';
import { upload } from '../../middleware/upload.js';
import { 
  getAllUsers,
  getSingleUser, 
  getRelationshipState, 
  sendFollowRequest, 
  acceptFollowRequest, 
  removeFollowRelationship,
  updateProfile,
  deleteAccount
} from './user.controller.js';

const router = Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/:id', requireAuth, getSingleUser);

router.get('/', requireAuth, getAllUsers);
router.get('/:id/relationship', requireAuth, getRelationshipState);
router.post('/:id/follow', requireAuth, sendFollowRequest);
router.patch('/:id/accept', requireAuth, acceptFollowRequest);
router.delete('/:id/cancel', requireAuth, removeFollowRelationship);

router.put('/profile', requireAuth, upload.single('avatar'), updateProfile);
router.delete('/profile', requireAuth, deleteAccount);

export default router;
