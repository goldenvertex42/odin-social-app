import { Router } from 'express';
import passport from 'passport';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getMe, 
  googleAuthCallback, 
  loginGuestUser 
} from './auth.controller.js';

const router = Router();

// --- Local Credential Authentication Endpoints ---
router.post('/register', registerUser);
router.post('/login', passport.authenticate('local', { session: false }), loginUser);
router.post('/logout', passport.authenticate('jwt', { session: false }), logoutUser);
router.get('/me', passport.authenticate('jwt', { session: false }), getMe);

// --- Instant Recruiter Guest Access Endpoint ---
router.post('/guest', loginGuestUser);

// --- Google Third-Party OAuth Endpoints ---
router.get(
  '/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false 
  })
);

router.get(
  '/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login', 
    session: false 
  }), 
  googleAuthCallback
);

export default router;
