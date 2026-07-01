import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../db/src/index.js';
import { getGravatarUrl } from '../utils/gravatar.js';

const productionApiUrl = process.env.VITE_API_URL; // Target the active Railway app backend variable
const cleanBackendBaseUrl = productionApiUrl && productionApiUrl.endsWith('/') 
  ? productionApiUrl.slice(0, -1) 
  : (productionApiUrl || 'http://localhost:3000');

// 1. PASSPORT-LOCAL STRATEGY (Used strictly during POST /api/auth/login)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        if (!user.passwordHash) {
          return done(null, false, { 
            message: 'Account registered via third-party provider. Please sign in with OAuth.' 
          });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// 2. PASSPORT-JWT STRATEGY (Used to protect all other incoming API requests)
passport.use(
  new JWTStrategy(
    {
      // Automatically extracts "Bearer <token>" from the Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
    },
    async (jwtPayload, done) => {
      try {
        // Fetch the user based on the ID stored in the token payload
        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.id },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isOnline: true,
          },
        });

        if (!user) {
          return done(null, false); // Token is valid, but user no longer exists
        }

        return done(null, user); // Successfully populates req.user
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// 3. PASSPORT-GOOGLE STRATEGY (Used strictly during GET /api/auth/google/callback)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // 🎯 FIXED: Dynamic cross-origin URL routing string interpolation
      callbackURL: `${cleanBackendBaseUrl}/api/auth/google/callback`,
      proxy: true // Ensures HTTPS headers pass through cloud load balancers safely
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('No email returned from Google authentication context'), null);
        }

        // 1. Defensively extract the Google photo URL supporting multiple library variants
        let googleAvatarUrl = null;
        if (profile.photos && profile.photos[0]) {
          googleAvatarUrl = profile.photos[0].value || profile.photos[0].url || null;
        }

        // Force a crisp, high-resolution square crop modifier if a match is caught
        if (googleAvatarUrl && googleAvatarUrl.includes('=s96-c')) {
          googleAvatarUrl = googleAvatarUrl.replace('=s96-c', '=s400-c');
        }

        // 2. Select final fallback avatar URL
        const finalAvatarUrl = googleAvatarUrl || getGravatarUrl(email);

        // Scan database registry for existing record rows
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: profile.id },
              { email: email }
            ]
          }
        });

        // CASE A: User record already occupies a database row
        if (user) {
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                // Apply Google photo if old avatar was missing or a generic gravatar fallback
                avatarUrl: user.avatarUrl && !user.avatarUrl.includes('gravatar.com') 
                  ? user.avatarUrl 
                  : finalAvatarUrl
              }
            });
          }
          return done(null, user);
        }

        // CASE B: Brand new OAuth registration node creation
        const baseUsername = profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomString = Math.random().toString(36).substring(2, 6);
        const usernamePlaceholder = baseUsername ? `${baseUsername}_${randomString}` : `user_${randomString}`;

        user = await prisma.user.create({
          data: {
            email: email,
            googleId: profile.id,
            displayName: profile.displayName || 'Community Member',
            username: usernamePlaceholder,
            avatarUrl: finalAvatarUrl,
            bio: 'Joined via Google. Welcome to my SocialSphere workspace context landscape!',
            colorPalette: 'default',
            colorScheme: 'light',
            passwordHash: 'oauth_managed_external_identity_token_lock'
          }
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);



export default passport;
