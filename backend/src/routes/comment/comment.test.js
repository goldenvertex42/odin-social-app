import request from 'supertest';
import app from '../../app.js';
import { clearDatabase, generateTestToken } from '../../../tests/helpers.js';
import { prisma } from '../../../../db/src/index.js';

describe('Comment Threading Integration Tests', () => {
  let activeUser, targetPost, userToken;

  beforeEach(async () => {
    await clearDatabase();
    
    // 1. Seed active viewer record
    activeUser = await prisma.user.create({
      data: { 
        email: 'commenter@odin.local', 
        username: 'comment_dev', 
        displayName: 'Odin Critic', 
        passwordHash: 'mock_hash', 
        colorPalette: 'default', 
        colorScheme: 'light' 
      }
    });
    userToken = generateTestToken(activeUser.id);

    // 2. Seed a post to attach comment vectors against
    targetPost = await prisma.post.create({
      data: { 
        content: 'Original thread anchor post.', 
        authorId: activeUser.id 
      }
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await prisma.$disconnect();
  });

  describe('POST /api/comments/post/:postId - Creation Pipeline', () => {
    it('should cleanly insert a comment when string payloads are valid', async () => {
      // FIXED: Adjusted to target your exact backend route registry path
      const res = await request(app)
        .post(`/api/comments/post/${targetPost.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Insightful response message text.' });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe('Insightful response message text.');
      expect(res.body.comment.author.id).toBe(activeUser.id);
    });

    it('should block execution with a 400 error if content is empty space strings', async () => {
      // FIXED: Adjusted to target your exact backend route registry path
      const res = await request(app)
        .post(`/api/comments/post/${targetPost.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: ' ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Comment content cannot be empty.');
    });

    it('should return a 404 if the containing post does not exist', async () => {
      // FIXED: Adjusted to target your exact backend route registry path
      const res = await request(app)
        .post('/api/comments/post/non-existent-uuid-string')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Ghost text comments.' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/comments/post/:postId - Chronological Thread Reader', () => {
    it('should fetch comments for a post in ascending forward-chronological order', async () => {
      // Seed first comment entry
      await prisma.comment.create({
        data: { content: 'First reply.', postId: targetPost.id, authorId: activeUser.id, createdAt: new Date(Date.now() - 10000) }
      });

      // Seed second comment entry
      await prisma.comment.create({
        data: { content: 'Second follow-up response.', postId: targetPost.id, authorId: activeUser.id, createdAt: new Date() }
      });

      // FIXED: Adjusted to target your exact backend route registry path
      const res = await request(app)
        .get(`/api/comments/post/${targetPost.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      // Assure forward-reading order for threaded chats (oldest first)
      expect(res.body[0].content).toBe('First reply.');
      expect(res.body[1].content).toBe('Second follow-up response.');
      expect(res.body[0]).toHaveProperty('author');
      
      // FIXED: Replaced legacy _count lookup with your optimized pre-loaded likes array verification
      expect(res.body[0]).toHaveProperty('likes');
    });
  });

  describe('PUT /api/comments/:commentId - Mutation Pipeline', () => {
    let testComment;

    beforeEach(async () => {
      testComment = await prisma.comment.create({
        data: { content: 'Original text before edit.', postId: targetPost.id, authorId: activeUser.id }
      });
    });

    it('should successfully update a comment when the original author requests it', async () => {
      const res = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Brand new polished text string.' });

      expect(res.statusCode).toBe(200);
      
      const dataContent = res.body.comment ? res.body.comment.content : res.body.content;
      expect(dataContent).toBe('Brand new polished text string.');
    });

    it('should return 403 if a user tries to modify someone else\'s comment', async () => {
      const stranger = await prisma.user.create({
        data: { email: 'spy@odin.local', username: 'spy_dev', displayName: 'Intruder', passwordHash: 'hash' }
      });
      const strangerToken = generateTestToken(stranger.id);

      const res = await request(app)
        .put(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ content: 'Malicious modification text.' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/comments/:commentId - Destruction Guard', () => {
    it('should delete a record when called by the correct owner', async () => {
      const commentToDelete = await prisma.comment.create({
        data: { content: 'Delete me soon.', postId: targetPost.id, authorId: activeUser.id }
      });

      const res = await request(app)
        .delete(`/api/comments/${commentToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const checkDb = await prisma.comment.findUnique({ where: { id: commentToDelete.id } });
      expect(checkDb).toBeNull();
    });

    it('should allow the post owner to delete comments written by third parties', async () => {
      const commentWriter = await prisma.user.create({
        data: { email: 'writer@odin.local', username: 'writer_dev', displayName: 'Spammer', passwordHash: 'hash' }
      });

      const offensiveComment = await prisma.comment.create({
        data: { content: 'Offensive spam message text.', postId: targetPost.id, authorId: commentWriter.id }
      });

      const res = await request(app)
        .delete(`/api/comments/${offensiveComment.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const checkDb = await prisma.comment.findUnique({ where: { id: offensiveComment.id } });
      expect(checkDb).toBeNull();
    });
  });
});
