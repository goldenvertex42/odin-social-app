import { jest, beforeEach, describe, it, expect, afterAll } from '@jest/globals';

// 1. Unified ESM Mock to catch post controller media uploader streams
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

describe('Post & Social Feed Integration Tests', () => {
  let request, app, clearDatabase, generateTestToken, prisma;
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;

  beforeEach(async () => {
    const helpers = await import('../../../tests/helpers.js');
    clearDatabase = helpers.clearDatabase;
    generateTestToken = helpers.generateTestToken;
    
    await clearDatabase();

    request = (await import('supertest')).default;
    app = (await import('../../app.js')).default;
    
    const dbModule = await import('../../../../db/src/index.js');
    prisma = dbModule.prisma;

    // Create User A (The Main Viewer)
    userA = await prisma.user.create({
      data: {
        email: 'viewer_alpha@odin.local',
        username: 'viewer_alpha',
        displayName: 'Odin Viewer Alpha',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light',
      },
    });

    // Create User B (An Active Connection)
    userB = await prisma.user.create({
      data: {
        email: 'friend_beta@odin.local',
        username: 'friend_beta',
        displayName: 'Odin Friend Beta',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light',
      },
    });

    // Create User C (A Pending Request or Stranger)
    userC = await prisma.user.create({
      data: {
        email: 'stranger_gamma@odin.local',
        username: 'stranger_gamma',
        displayName: 'Odin Stranger Gamma',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light',
      },
    });

    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);
    tokenC = generateTestToken(userC.id);

    // User A follows User B (FOLLOWING relationship)
    await prisma.follow.create({
      data: { followerId: userA.id, followingId: userB.id, status: 'FOLLOWING' },
    });

    // User A follows User C (REQUEST_SENT relationship - excluded from feed)
    await prisma.follow.create({
      data: { followerId: userA.id, followingId: userC.id, status: 'REQUEST_SENT' },
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await prisma.$disconnect();
  });

  describe('POST /api/posts - Content Creation Pipeline', () => {
    it('should allow a logged-in user to publish content and image files successfully', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('content', 'Testing form-data multi-part content pipeline.')
        .attach('image', Buffer.from('fake-binary-data'), 'test-photo.png');

      expect(res.statusCode).toBe(201);
      // Fixed: Swapped '.body' to '.content' to match Prisma production keys
      expect(res.body.post.content).toBe('Testing form-data multi-part content pipeline.');
      expect(res.body.post.imageUrl).toBeDefined();
    });

    it('should reject content creations when content string parameters are empty', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        // Fixed: Use field layout because form-data multi-part middleware intercepts this route handler path
        .field('content', ' ');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Post content cannot be empty.');
    });
  });

  describe('GET /api/posts/feed - Chronological Aggregation Pipeline', () => {
    it('should aggregate self posts and accepted follow posts while filtering out pending connections', async () => {
      // Fixed: Swapped '.body' payload attributes to '.content' column schemas
      await prisma.post.create({
        data: { content: 'Hello from User Beta!', authorId: userB.id },
      });

      await prisma.post.create({
        data: { content: 'Secret thoughts from User Gamma.', authorId: userC.id },
      });

      await prisma.post.create({
        data: { content: 'My personal update notice.', authorId: userA.id },
      });

      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const includesGammaContent = res.body.some(post => post.authorId === userC.id);
      expect(includesGammaContent).toBe(false);

      // Fixed: Evaluated properties directly on the element index, not on the parent wrapper array
      expect(res.body[0]).toHaveProperty('author');
      expect(res.body[0]).toHaveProperty('likes');
      expect(res.body[0]).toHaveProperty('comments');
    });

    it('should enforce descending chronological ordering across the entire dataset arrays', async () => {
      await prisma.post.create({
        data: {
          content: 'Old news statement.',
          authorId: userB.id,
          createdAt: new Date(Date.now() - 60000)
        },
      });

      const newerPost = await prisma.post.create({
        data: {
          content: 'Breaking recent news updates.',
          authorId: userB.id,
          createdAt: new Date()
        },
      });

      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body[0].id).toBe(newerPost.id);
      expect(res.body[0].content).toBe('Breaking recent news updates.');
    });
  });

  describe('PUT /api/posts/:postId - Content Modification', () => {
    let activePost;
    beforeEach(async () => {
      activePost = await prisma.post.create({
        data: { content: 'Original text baseline content.', authorId: userA.id }
      });
    });

    it('should allow the author to edit post body parameters', async () => {
      const res = await request(app)
        .put(`/api/posts/${activePost.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'Modified and updated text parameter.' });

      expect(res.statusCode).toBe(200);
      expect(res.body.post.content).toBe('Modified and updated text parameter.');
    });

    it('should block edits made by non-author user tokens with a 403 status', async () => {
      const res = await request(app)
        .put(`/api/posts/${activePost.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Malicious modification text content.' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/posts/:postId - Node Removal Lifecycle', () => {
    it('should allow clean purging when requested by the creator', async () => {
      const postToDelete = await prisma.post.create({
        data: { content: 'Transient mock content item.', authorId: userA.id }
      });

      const res = await request(app)
        .delete(`/api/posts/${postToDelete.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(204);

      const checkDb = await prisma.post.findUnique({ where: { id: postToDelete.id } });
      expect(checkDb).toBeNull();
    });

    it('should block delete operations from unauthorized accounts', async () => {
      const securePost = await prisma.post.create({
        data: { content: 'Protected author asset.', authorId: userA.id }
      });

      const res = await request(app)
        .delete(`/api/posts/${securePost.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(403);

      const checkDb = await prisma.post.findUnique({ where: { id: securePost.id } });
      expect(checkDb).not.toBeNull();
    });
  });

  describe('GET /api/posts/user/:id - Individual User Timelines', () => {
    it('should aggregate only posts created by the specified author id in descending order', async () => {
      const postFromBeta = await prisma.post.create({
        data: { content: 'User Beta specific update text.', authorId: userB.id }
      });

      await prisma.post.create({
        data: { content: 'User Alpha isolated text.', authorId: userA.id }
      });

      const res = await request(app)
        .get(`/api/posts/user/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(postFromBeta.id);
      expect(res.body[0].content).toBe('User Beta specific update text.');
      expect(res.body[0]).toHaveProperty('author');
      expect(res.body[0]).toHaveProperty('likes');
      expect(res.body[0]).toHaveProperty('comments');
    });

    it('should return 404 if the requested author id does not exist in the registry', async () => {
      const res = await request(app)
        .get('/api/posts/user/non-existent-uuid-string')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/posts/:postId - Standalone Deep-Linked Thread Fetcher', () => {
    it('should retrieve a single post with nested deep relation arrays hydrated cleanly', async () => {
      const targetPost = await prisma.post.create({
        data: { content: 'Isolated post target text anchor.', authorId: userB.id }
      });

      const res = await request(app)
        .get(`/api/posts/${targetPost.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
        
      expect(res.statusCode).toBe(200);
      expect(typeof res.body).toBe('object');
      expect(res.body.id).toBe(targetPost.id);
      expect(res.body.content).toBe('Isolated post target text anchor.');
      expect(res.body).toHaveProperty('author');
      expect(res.body).toHaveProperty('likes');
      expect(res.body).toHaveProperty('comments');
    });
      
    it('should return a 404 status error if the post id does not match database rows', async () => {
      const res = await request(app)
        .get('/api/posts/non-existent-post-uuid')
        .set('Authorization', `Bearer ${tokenA}`);
        
      expect(res.statusCode).toBe(404);
    });
  });
});