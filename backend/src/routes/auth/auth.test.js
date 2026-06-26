import { jest, beforeEach, describe, it, expect, afterAll } from '@jest/globals';

describe('Authentication Routing Integration Tests', () => {
  let request, app, clearDatabase, generateTestToken, prisma;
  const testUserPayload = { 
    email: 'test_recruiter@odin.local', 
    username: 'test_dev_user', 
    password: 'OdinPassword123!', 
    displayName: 'Odin Developer' 
  };

  beforeEach(async () => {
    const helpers = await import('../../../tests/helpers.js');
    clearDatabase = helpers.clearDatabase;
    generateTestToken = helpers.generateTestToken;

    await clearDatabase();

    request = (await import('supertest')).default;
    app = (await import('../../app.js')).default;
    
    const dbModule = await import('../../../../db/src/index.js');
    prisma = dbModule.prisma;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  // 1. TEST REGISTRATION
  describe('POST /api/auth/register', () => {
    it('should successfully register a user, set defaults, and provide a valid token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUserPayload.email);
      expect(res.body.user.colorPalette).toBe('default');
      expect(res.body.user.colorScheme).toBe('light');
      expect(res.body.user.avatarUrl.toLowerCase()).toContain('gravatar.com');
      expect(res.body.user).not.toHaveProperty('passwordHash'); 
    });

    it('should prevent registration if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.local' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Missing required fields.');
    });
  });

  // 2. TEST LOCAL LOGIN
  describe('POST /api/auth/login', () => {
    it('should successfully log in, return a JWT, and set isOnline to true', async () => {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.default.genSalt(10);
      const hash = await bcrypt.default.hash(testUserPayload.password, salt);

      await prisma.user.create({
        data: { 
          email: testUserPayload.email, 
          username: testUserPayload.username, 
          displayName: testUserPayload.displayName, 
          passwordHash: hash 
        }
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserPayload.email, password: testUserPayload.password });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.isOnline).toBe(true);
    });
  });

  // 3. TEST RECRUITER GUEST SIGN-IN
  describe('POST /api/auth/guest', () => {
    it('should instantly resolve the static recruiter guest with custom defaults', async () => {
      await prisma.user.create({
        data: {
          email: 'recruiter@socialsphere.com',
          username: 'recruiter_guest',
          displayName: 'Hiring Manager Guest',
          passwordHash: '$2b$10$2TC9RtF/OEaleV7xnxZ75uqxwfQ3HPr.FLbS4MgT3S6Lk7YwzXybe',
          avatarUrl: 'https://gravatar.com',
          bio: 'Explore mode activated. Previewing system architecture and decoupled state machines.',
          colorPalette: 'default',
          colorScheme: 'light',
          isOnline: false,
          isGuest: true,
        }
      });

      const res = await request(app).post('/api/auth/guest');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.isGuest).toBe(true);
      expect(res.body.user.isOnline).toBe(true);
      expect(res.body.user.colorPalette).toBe('default');
      expect(res.body.user.colorScheme).toBe('light');
    });
  });


  // 4. TEST ID PROFILE SYNC (GET /ME)
  describe('GET /api/auth/me', () => {
    it('should securely fetch user profile attributes when a valid token header is set', async () => {
      const dbUser = await prisma.user.create({
        data: { 
          email: testUserPayload.email, 
          username: testUserPayload.username, 
          displayName: testUserPayload.displayName 
        }
      });

      const token = generateTestToken(dbUser.id);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(testUserPayload.username);
      expect(res.body).toHaveProperty('colorPalette');
    });

    it('should block profile requests if an authorization token is omitted', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });

  // 5. TEST LOGOUT TERMINATIONS
  describe('POST /api/auth/logout', () => {
    it('should allow an active user to terminate their session successfully', async () => {
      const dbUser = await prisma.user.create({
        data: { 
          email: 'logging_out@odin.local', 
          username: 'logout_user', 
          displayName: 'Logout Dev', 
          isOnline: true 
        }
      });

      const token = generateTestToken(dbUser.id);
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      const updatedUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
      expect(updatedUser.isOnline).toBe(false);
    });
  });
});
