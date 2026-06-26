import { jest, beforeEach, describe, it, expect, afterAll } from '@jest/globals';

jest.unstable_mockModule('cloudinary', () => {
  const mockConfig = jest.fn();
  const mockUploader = {
    upload_stream: jest.fn((options, callback) => ({
      end: jest.fn(() => {
        callback(null, { secure_url: 'https://cloudinary.com' });
      })
    })),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' })
  };
  const v2Mock = { config: mockConfig, uploader: mockUploader };
  return { v2: v2Mock, default: { config: mockConfig, v2: v2Mock } };
});

describe('User Social Graph Integration Tests', () => {
  let request, app, clearDatabase, generateTestToken, prisma;
  let userA, userB, tokenA, tokenB;

  beforeEach(async () => {
    const helpers = await import('../../../tests/helpers.js');
    clearDatabase = helpers.clearDatabase;
    generateTestToken = helpers.generateTestToken;

    await clearDatabase();

    request = (await import('supertest')).default;
    app = (await import('../../app.js')).default;
    
    const dbModule = await import('../../../../db/src/index.js');
    prisma = dbModule.prisma;

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

    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('GET /api/users - Fetch All Users Pipeline', () => {
    it('should fetch all users except self and track active followStatus strings', async () => {
      await prisma.follow.create({ 
        data: { followerId: userA.id, followingId: userB.id, status: 'REQUEST_SENT' } 
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(userB.id);
      expect(res.body[0].followStatus).toBe('REQUEST_SENT');
      expect(res.body[0]).not.toHaveProperty('receivedFollows');
    });
  });

  describe('GET /api/users/:id - Fetch Single User Profile Data Matrix', () => {
    it('should cleanly return self profile configurations with SELF relationship status', async () => {
      const res = await request(app)
        .get(`/api/users/${userA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(userA.id);
      expect(res.body.username).toBe('user_alpha');
      expect(res.body.relationshipStatus).toBe('SELF');
    });

    it('should return an external profile marked as REQUEST_SENT when outbound request is pending', async () => {
      await prisma.follow.create({ 
        data: { followerId: userA.id, followingId: userB.id, status: 'REQUEST_SENT' } 
      });

      const res = await request(app)
        .get(`/api/users/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(userB.id);
      expect(res.body.relationshipStatus).toBe('REQUEST_SENT');
      expect(res.body).not.toHaveProperty('receivedFollows');
    });

    it('should return an external profile marked as FOLLOWING when follow link is accepted', async () => {
      await prisma.follow.create({ 
        data: { followerId: userA.id, followingId: userB.id, status: 'FOLLOWING' } 
      });

      const res = await request(app)
        .get(`/api/users/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.relationshipStatus).toBe('FOLLOWING');
    });

    it('should return 404 if the target user id does not exist in the database', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-uuid-string')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/users/:id/relationship', () => {
    it('should return NOT_FOLLOWING when no database row connects the users', async () => {
      const res = await request(app)
        .get(`/api/users/${userB.id}/relationship`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.relationshipState).toBe('NOT_FOLLOWING');
    });
  });

  describe('POST /api/users/:id/follow', () => {
    it('should initialize an outbound follow record explicitly marked as REQUEST_SENT', async () => {
      const res = await request(app)
        .post(`/api/users/${userB.id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('REQUEST_SENT');

      const dbRow = await prisma.follow.findUnique({ 
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } } 
      });
      expect(dbRow.status).toBe('REQUEST_SENT');
    });
  });

  describe('PATCH /api/users/:id/accept', () => {
    it('should accept an inbound request and elevate status to FOLLOWING', async () => {
      await prisma.follow.create({ 
        data: { followerId: userA.id, followingId: userB.id, status: 'REQUEST_SENT' } 
      });

      const res = await request(app)
        .patch(`/api/users/${userA.id}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);

      const dbRow = await prisma.follow.findUnique({ 
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } } 
      });
      expect(dbRow.status).toBe('FOLLOWING');
    });
  });

  describe('DELETE /api/users/:id/cancel', () => {
    it('should completely soft-reset the follow status row to NOT_FOLLOWING in the database', async () => {
      await prisma.follow.create({ 
        data: { followerId: userA.id, followingId: userB.id, status: 'FOLLOWING' } 
      });

      const res = await request(app)
        .delete(`/api/users/${userB.id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);

      const dbRow = await prisma.follow.findUnique({ 
        where: { followerId_followingId: { followerId: userA.id, followingId: userB.id } } 
      });
      expect(dbRow.status).toBe('NOT_FOLLOWING');
    });
  });

  describe('PUT /api/users/profile - Configuration Syncing', () => {
    it('should successfully update biography configurations and attach a brand new custom avatar file', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('displayName', 'Polished Local Upload Name')
        .field('bio', 'Consolidated fully within our application infrastructure.')
        .field('colorPalette', 'cyberpunk')
        .field('colorScheme', 'dark')
        .attach('avatar', Buffer.from('fake-image-data-string'), 'test-avatar.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body.user.displayName).toBe('Polished Local Upload Name');
      expect(res.body.user.colorPalette).toBe('cyberpunk');
      expect(res.body.user.avatarUrl).toBeDefined();
    });
  });
});
