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
    // Passport's middleware successfully completed, so req.user is ready!
    const user = req.user;

    // Mutate database state to declare active network presence
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true }
    });

    // Map structural values cleanly using the freshly updated model row
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

    // Issue the stateless web token
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

    // Flip presence toggle state back to offline
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
    // Pull live theme and profile configurations straight from the schema
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

    // Set network presence status to true
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnline: true }
    });

    const token = generateToken(req.user.id);
    
    // Dynamic production-ready redirect link parsing
    const frontendRedirectUrl = `${frontendBaseUrl}/auth-success?token=${token}`;
    return res.redirect(frontendRedirectUrl);
  } catch (error) {
    next(error);
  }
};

// 6. INSTANT RECRUITER GUEST CONTROLLER
export const loginGuestUser = async (req, res, next) => {
  try {
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const guestUsername = `recruiter_guest_${uniqueId}`;
    const guestEmail = `${guestUsername}@guest.odin.local`;

    const guestAvatar = getGravatarUrl(guestEmail);

    const newGuest = await prisma.user.create({
      data: {
        email: guestEmail,
        username: guestUsername,
        displayName: "✨ Recruiter Guest Profile",
        avatarUrl: guestAvatar,
        bio: "Logged in via instant guest token access. Feel free to explore!",
        colorPalette: "cyberpunk",
        colorScheme: "dark",
        isOnline: true,
        isGuest: true,
      },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatarUrl: true, bio: true, colorPalette: true, colorScheme: true,
        isOnline: true, isGuest: true, createdAt: true
      }
    });

    const token = generateToken(newGuest.id);
    return res.status(201).json({ message: 'Guest workspace initialized successfully.', token, user: newGuest });
  } catch (error) {
    next(error);
  }
};
