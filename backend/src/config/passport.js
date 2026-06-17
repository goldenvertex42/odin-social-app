import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../db/src/index.js';

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
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // 1. Extract the high-res Google profile photo if it exists
        let googleAvatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        if (googleAvatarUrl && googleAvatarUrl.includes('=s96-c')) {
          googleAvatarUrl = googleAvatarUrl.replace('=s96-c', '=s400-c'); // Force higher resolution
        }

        // 2. Determine final avatar choice (Google image vs. Gravatar fallback)
        const finalAvatarUrl = googleAvatarUrl || getGravatarUrl(email);

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
          // If they are a local user linking Google for the first time
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { 
                googleId: profile.id, 
                // Upgrade to Google photo if their old avatar was missing or a generic fallback
                avatarUrl: user.avatarUrl && !user.avatarUrl.includes('gravatar.com') ? user.avatarUrl : finalAvatarUrl 
              }
            });
          }
          return done(null, user);
        }

        // CASE B: Brand new OAuth registration node creation
        const baseUsername = profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomString = Math.random().toString(36).substring(2, 6);
        const usernamePlaceholder = `${baseUsername}_${randomString}`;

        user = await prisma.user.create({
          data: {
            email: email,
            googleId: profile.id,
            displayName: profile.displayName,
            username: usernamePlaceholder,
            avatarUrl: finalAvatarUrl, // Natively assigns Google photo or custom Gravatar retro layout
            colorPalette: 'default',
            colorScheme: 'light'
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
