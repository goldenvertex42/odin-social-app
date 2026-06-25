import { jest, beforeEach, describe, it, expect, afterAll } from '@jest/globals';

// 1. Unified ESM Mock to catch post controller media uploader streams
jest.unstable_mockModule('cloudinary', () => {
  const mockConfig = jest.fn();
  const mockUploader = {
    upload_stream: jest.fn((options, callback) => ({
      end: jest.fn(() => {
        callback(null, { secure_url: 'https://cloudinary.com' });
      })
    }))
  };
  const v2Mock = { config: mockConfig, uploader: mockUploader };
  return { v2: v2Mock, default: { config: mockConfig, v2: v2Mock } };
});

// 2. Safely dynamic-import your local app dependencies below the module mock
const request = (await import('supertest')).default;
const app = (await import('../../app.js')).default;
const { clearDatabase, generateTestToken } = await import('../../../tests/helpers.js');
const { prisma } = await import('../../../../db/src/index.js');

describe('Post & Social Feed Integration Tests', () => {
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;

  beforeEach(async () => {
    // 1. Wipe out database states using your helper module
    await clearDatabase();

    // 2. Create User A (The Main Viewer)
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

    // 3. Create User B (An Accepted Friend)
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

    // 4. Create User C (A Pending Request or Stranger)
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

    // 5. Build Authorized Testing Access Token Contexts
    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);
    tokenC = generateTestToken(userC.id);

    // 6. Establish Social Graph Topology Connections
    // User A follows User B (ACCEPTED relationship)
    await prisma.follow.create({
      data: { followerId: userA.id, followingId: userB.id, status: 'ACCEPTED' },
    });

    // User A follows User C (PENDING relationship - should be excluded from feed)
    await prisma.follow.create({
      data: { followerId: userA.id, followingId: userC.id, status: 'PENDING' },
    });
  });

  afterAll(async () => {
    // Give query loops a brief moment to settle down before disconnecting
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
      expect(res.body.post.content).toBe('Testing form-data multi-part content pipeline.');
      expect(res.body.post.imageUrl).toBeDefined();
    });

    it('should reject content creations when content string parameters are empty', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: ' ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Post content cannot be empty.');
    });
  });

  describe('GET /api/posts/feed - Chronological Aggregation Pipeline', () => {
    it('should aggregate self posts and accepted follow posts while filtering out pending connections', async () => {
      // Seed a post by the Accepted Friend (User B)
      await prisma.post.create({
        data: { content: 'Hello from User Beta!', authorId: userB.id },
      });

      // Seed a post by the Pending Contact (User C - should NOT appear in User A's feed)
      await prisma.post.create({
        data: { content: 'Secret thoughts from User Gamma.', authorId: userC.id },
      });

      // Seed a post by the logged-in User Self (User A)
      await prisma.post.create({
        data: { content: 'My personal update notice.', authorId: userA.id },
      });

      // Fetch the composite social graph feed as User A
      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Total count should equal exactly 2 (User A's own post + User B's post)
      expect(res.body.length).toBe(2);

      // Assure that User C's post was strictly dropped
      const includesGammaContent = res.body.some(post => post.authorId === userC.id);
      expect(includesGammaContent).toBe(false);

      // FIXED: Swapped out deprecated _count property matchers to align with rich pre-loaded array footprints
      expect(res.body[0]).toHaveProperty('author');
      expect(res.body[0]).toHaveProperty('likes');
      expect(res.body[0]).toHaveProperty('comments');
    });

    it('should enforce descending chronological ordering across the entire dataset arrays', async () => {
      // Seed older post from Friend Beta
      await prisma.post.create({
        data: {
          content: 'Old news statement.',
          authorId: userB.id,
          createdAt: new Date(Date.now() - 60000) // 1 minute ago
        },
      });

      // Seed modern post from Friend Beta
      const newerPost = await prisma.post.create({
        data: {
          content: 'Breaking recent news updates.',
          authorId: userB.id,
          createdAt: new Date() // Just now
        },
      });

      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      // Index [0] must contain the most recent post node entry
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

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

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
      // Seed a post from Target User B
      const postFromBeta = await prisma.post.create({
        data: { content: 'User Beta specific update text.', authorId: userB.id }
      });

      // Seed a post from User A (should be filtered out since we are querying User B's route)
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
      
      // Enforce your frontend relation hydration contracts
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
      
      // Ensure the deeply nested comment layers match frontend PostView requirements
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
