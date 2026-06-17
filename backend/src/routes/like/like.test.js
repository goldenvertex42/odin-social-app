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
      data: { content: 'Likeable baseline post anchor content.', authorId: activeUser.id }
    });

    testComment = await prisma.comment.create({
      data: { content: 'Likeable comment sentence.', postId: testPost.id, authorId: activeUser.id }
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await prisma.$disconnect();
  });

  describe('POST /api/likes/post/:postId', () => {
    it('should create a PostLike record if none exists (Like)', async () => {
      const res = await request(app)
        .post(`/api/likes/post/${testPost.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.liked).toBe(true);

      const dbCheck = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: testPost.id, userId: activeUser.id } } // Updated key order
      });
      expect(dbCheck).not.toBeNull();
    });

    it('should destroy an existing PostLike record if toggled twice (Unlike)', async () => {
      // Establish an existing like row beforehand
      await prisma.postLike.create({
        data: { userId: activeUser.id, postId: testPost.id }
      });

      const res = await request(app)
        .post(`/api/likes/post/${testPost.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.liked).toBe(false);

      const dbCheck = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: testPost.id, userId: activeUser.id } } // Updated key order
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

      expect(likeRes.statusCode).toBe(201);
      expect(likeRes.body.liked).toBe(true);

      // Second click: Unlike comment
      const unlikeRes = await request(app)
        .post(`/api/likes/comment/${testComment.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(unlikeRes.statusCode).toBe(200);
      expect(unlikeRes.body.liked).toBe(false);
    });
  });
});
