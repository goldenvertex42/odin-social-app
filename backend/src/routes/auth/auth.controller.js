import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { getGravatarUrl } from '../../utils/gravatar.js';
import { prisma } from '../../../../db/src/index.js';

// Helper function to generate stateless JWTs
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
    { expiresIn: '1d' } // Token expires in 24 hours
  );
};

// 1. LOCAL REGISTRATION CONTROLLER
export const registerUser = async (req, res, next) => {
  try {
    const { email, username, password, displayName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const defaultAvatarUrl = getGravatarUrl(email);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        avatarUrl: defaultAvatarUrl,
        passwordHash,
        colorPalette: 'default',
        colorScheme: 'light'
      },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatarUrl: true, bio: true, colorPalette: true, colorScheme: true,
        isOnline: true, isGuest: true, createdAt: true
      }
    });

    const token = generateToken(newUser.id);
    return res.status(201).json({ message: 'User registered successfully.', token, user: newUser });
  } catch (error) {
    next(error);
  }
};

// 2. LOCAL LOGIN CONTROLLER
export const loginUser = async (req, res, next) => {
  try {
    const user = req.user;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true }
    });

    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      colorPalette: updatedUser.colorPalette,
      colorScheme: updatedUser.colorScheme,
      isOnline: updatedUser.isOnline,
      isGuest: updatedUser.isGuest
    };

    const token = generateToken(updatedUser.id);

    return res.status(200).json({ message: 'Logged in successfully.', token, user: safeUser });
  } catch (error) {
    return next(error);
  }
};

// 3. LOGOUT CONTROLLER
export const logoutUser = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized payload exception.' });
    }

    await prisma.user.update({
      where: { id: currentUserId },
      data: { isOnline: false }
    });

    return res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    return next(error);
  }
};

// 4. SELF IDENTITY SYNC CONTROLLER
export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  try {
    const freshUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        colorPalette: true,
        colorScheme: true,
        isOnline: true,
        isGuest: true
      }
    });
    return res.status(200).json(freshUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to synchronize live identity attributes.' });
  }
};

// 5. GOOGLE OAUTH CALLBACK CONTROLLER
export const googleAuthCallback = async (req, res, next) => {
  try {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.user) {
      return res.redirect(`${frontendBaseUrl}/login?error=oauth_failed`);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnline: true }
    });

    const token = generateToken(req.user.id);
    
    const frontendRedirectUrl = `${frontendBaseUrl}/auth-success?token=${token}`;
    return res.redirect(frontendRedirectUrl);
  } catch (error) {
    next(error);
  }
};

// 6. INSTANT RECRUITER GUEST CONTROLLER
export const loginGuestUser = async (req, res, next) => {
  try {
    const guestUser = await prisma.user.findUnique({
      where: { 
        email: 'visitor@socialsphere.com' 
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        colorPalette: true,
        colorScheme: true,
        isOnline: true,
        isGuest: true,
        createdAt: true
      }
    });

    if (!guestUser) {
      const fallbackGuest = await prisma.user.create({
        data: {
          email: 'recruiter@socialsphere.com',
          username: 'recruiter_guest',
          displayName: 'Hiring Manager Guest',
          passwordHash: '$2b$10$2TC9RtF/OEaleV7xnxZ75uqxwfQ3HPr.FLbS4MgT3S6Lk7YwzXybe',
          avatarUrl: getGravatarUrl(email),
          bio: 'Explore mode activated. Previewing system architecture and decoupled state machines.',
          colorPalette: 'default',
          colorScheme: 'light',
          isOnline: true,
          isGuest: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          colorPalette: true,
          colorScheme: true,
          isOnline: true,
          isGuest: true,
          createdAt: true
        }
      });

      const token = generateToken(fallbackGuest.id);
      return res.status(200).json({
        message: 'Guest workspace initialized via fallback provisioning.',
        token,
        user: fallbackGuest
      });
    }

    if (!guestUser.isOnline) {
      await prisma.user.update({
        where: { id: guestUser.id },
        data: { isOnline: true }
      });
      guestUser.isOnline = true;
    }

    const token = generateToken(guestUser.id);

    return res.status(200).json({
      message: 'Guest workspace initialized successfully.',
      token,
      user: guestUser
    });
  } catch (error) {
    next(error);
  }
};

