import request from 'supertest';
import app from '../../app.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';
import { prisma } from '../../../../db/src/index.js';

describe('Engagement Toggle Integration Tests', () => {
  let activeUser, testPost, testComment, userToken;

  beforeEach(async () => {
    await clearDatabase();
    
    activeUser = await prisma.user.create({
      data: {
        email: 'liker@odin.local',
        username: 'like_master',
        displayName: 'Odin Fan',
        passwordHash: 'mock_hash',
        colorPalette: 'default',
        colorScheme: 'light'
      }
    });

    userToken = generateTestToken(activeUser.id);

    testPost = await prisma.post.create({
      data: {
        content: 'Likeable baseline post anchor content.',
        authorId: activeUser.id
      }
    });

    testComment = await prisma.comment.create({
      data: {
        content: 'Likeable comment sentence.',
        postId: testPost.id,
        authorId: activeUser.id
      }
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await prisma.$disconnect();
  });

  describe('POST /api/likes/post/:postId', () => {
    it('should cycle a PostLike record successfully (Like)', async () => {
      const res = await request(app)
        .post(`/api/likes/post/${testPost.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Handle both 201 status envelopes or direct 200 array footprint returns safely
      expect([200, 201]).toContain(res.statusCode);
      
      const dbCheck = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: testPost.id, userId: activeUser.id } }
      });
      expect(dbCheck).not.toBeNull();
    });

    it('should destroy an existing PostLike record if toggled twice (Unlike)', async () => {
      // Establish an existing like row beforehand
      await prisma.postLike.create({
        data: { postId: testPost.id, userId: activeUser.id }
      });

      const res = await request(app)
        .post(`/api/likes/post/${testPost.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);

      const dbCheck = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: testPost.id, userId: activeUser.id } }
      });
      expect(dbCheck).toBeNull();
    });
  });

  describe('POST /api/likes/comment/:commentId', () => {
    it('should successfully cycle a CommentLike lifecycle when clicked', async () => {
      // First click: Like comment
      const likeRes = await request(app)
        .post(`/api/likes/comment/${testComment.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 201]).toContain(likeRes.statusCode);

      // Second click: Unlike comment
      const unlikeRes = await request(app)
        .post(`/api/likes/comment/${testComment.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(unlikeRes.statusCode).toBe(200);
    });
  });
});
