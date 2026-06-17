import request from 'supertest';
import app from '../../app.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';
import { prisma } from '../../../../db/src/index.js';

describe('User Social Graph Integration Tests', () => {
  let userA, userB, tokenA, tokenB;

  // Mirror the setup block from your passing auth test file
  beforeEach(async () => {
    await clearDatabase();

    // Seed User A with the exact lowercase design defaults proven by auth tests
    userA = await prisma.user.create({
      data: {
        email: 'alpha@odin.local',
        username: 'user_alpha',
        displayName: 'Odin Alpha',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light',
        avatarUrl: 'https://dicebear.com',
        isOnline: true
      },
    });

    // Seed User B
    userB = await prisma.user.create({
      data: {
        email: 'beta@odin.local',
        username: 'user_beta',
        displayName: 'Odin Beta',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light',
        avatarUrl: 'https://dicebear.com',
        isOnline: false
      },
    });

    // Generate tokens utilizing your existing helper signature
    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/users - Fetch All Users Pipeline', () => {
    it('should fetch all users except self and track active followStatus strings', async () => {
      // Create a pending join row from User A to User B
      await prisma.follow.create({
        data: { followerId: userA.id, followingId: userB.id, status: 'PENDING' }
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // We expect 1 user (User B) since User A is filtered out
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(userB.id);
      expect(res.body[0].followStatus).toBe('PENDING');
      expect(res.body[0]).not.toHaveProperty('receivedFollows');
    });
  });

  describe('GET /api/users/:id/relationship', () => {
    it('should return NONE when no database row connects the users', async () => {
      const res = await request(app)
        .get(`/api/users/${userB.id}/relationship`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.relationshipState).toBe('NONE');
    });
  });

  describe('POST /api/users/:id/follow', () => {
    it('should initialize an outbound follow record explicitly marked as PENDING', async () => {
      const res = await request(app)
        .post(`/api/users/${userB.id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('PENDING');

      // Double check DB state persistence
      const dbRow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } }
      });
      expect(dbRow.status).toBe('PENDING');
    });
  });

  describe('PATCH /api/users/:id/accept', () => {
    it('should accept an inbound request and elevate status to ACCEPTED', async () => {
      // User A requests User B
      await prisma.follow.create({
        data: { followerId: userA.id, followingId: userB.id, status: 'PENDING' }
      });

      // User B updates the relation targeting User A's ID
      const res = await request(app)
        .patch(`/api/users/${userA.id}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);

      const dbRow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } }
      });
      expect(dbRow.status).toBe('ACCEPTED');
    });
  });

  describe('DELETE /api/users/:id/cancel', () => {
    it('should completely purge the follow row from the database', async () => {
      await prisma.follow.create({
        data: { followerId: userA.id, followingId: userB.id, status: 'ACCEPTED' }
      });

      const res = await request(app)
        .delete(`/api/users/${userB.id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);

      const dbRow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } }
      });
      expect(dbRow).toBeNull();
    });
  });

  describe('PUT /api/users/profile - Configuration Syncing', () => {
    it('should successfully update a user\'s biography and design layout track preferences', async () => {
      const payload = {
        displayName: 'Polished Developer Name',
        bio: 'Coding in a feature-based architecture pattern.',
        colorPalette: 'cyberpunk',
        colorScheme: 'dark'
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.displayName).toBe(payload.displayName);
      expect(res.body.user.bio).toBe(payload.bio);
      expect(res.body.user.colorPalette).toBe('cyberpunk');
      expect(res.body.user.colorScheme).toBe('dark');

      // Assert database record persistence
      const dbCheck = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(dbCheck.colorPalette).toBe('cyberpunk');
    });

    it('should reject profile updates if the color option payload values violate schema limits', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ colorPalette: 'invalid_neon_rainbow_theme' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid color palette configuration selection.');
    });
  });

});
