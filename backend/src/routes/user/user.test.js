import { jest, beforeEach, describe, it, expect, afterAll } from '@jest/globals';

// 1. Unified ESM Mock that injects 'config' everywhere it could possibly be read
jest.unstable_mockModule('cloudinary', () => {
  const mockConfig = jest.fn();
  
  const mockUploader = {
    upload_stream: jest.fn((options, callback) => ({
      end: jest.fn(() => {
        callback(null, { 
          secure_url: 'https://cloudinary.com' 
        });
      })
    }))
  };

  // This object represents 'v2'. It MUST have both 'uploader' and 'config'
  const v2Mock = {
    config: mockConfig,
    uploader: mockUploader
  };

  return {
    // Satisfies: import { v2 } from 'cloudinary'; (where v2.config() or v2.uploader are called)
    v2: v2Mock,
    // Satisfies: import cloudinary from 'cloudinary';
    default: {
      config: mockConfig,
      v2: v2Mock
    }
  };
});

// 2. NOW safely import your local application files underneath
const request = (await import('supertest')).default;
const app = (await import('../../app.js')).default;
const { clearDatabase, generateTestToken } = await import('../../../tests/helpers.js');
const { prisma } = await import('../../../../db/src/index.js');

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
    it('should successfully update biography configurations and attach a brand new custom avatar file', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('displayName', 'Polished Local Upload Name')
        .field('bio', 'Consolidated fully within our application infrastructure.')
        .field('colorPalette', 'cyberpunk')
        .field('colorScheme', 'dark')
        // Simulates attaching a raw binary file from your testing environment
        .attach('avatar', Buffer.from('fake-image-data-string'), 'test-avatar.jpg');

      expect(res.statusCode).toBe(200);
      expect(res.body.user.displayName).toBe('Polished Local Upload Name');
      expect(res.body.user.colorPalette).toBe('cyberpunk');
      // Assures that the backend returned a cloud path instead of a static gravatar token
      expect(res.body.user.avatarUrl).toBeDefined();
    });
  });

});
