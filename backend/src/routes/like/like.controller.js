import { prisma } from '../../../../db/src/index.js';

// 1. TOGGLE POST LIKE STATUS
export const togglePostLike = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;

    const targetPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!targetPost) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: currentUserId } }
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId, userId: currentUserId } }
      });
    } else {
      await prisma.postLike.create({
        data: { postId, userId: currentUserId }
      });
    }

    const updatedLikes = await prisma.postLike.findMany({
      where: { postId }
    });

    return res.status(200).json(updatedLikes);
  } catch (error) {
    next(error);
  }
};


// 2. TOGGLE COMMENT LIKE STATUS
export const toggleCommentLike = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { commentId } = req.params;

    const targetComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!targetComment) {
      return res.status(404).json({ message: 'Target comment not found.' });
    }

    // MATCHES REVERSED SCHEMA: commentId first, then userId
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: currentUserId
        }
      }
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId: currentUserId
          }
        }
      });
      return res.status(200).json({ liked: false, message: 'Comment unliked successfully.' });
    } else {
      await prisma.commentLike.create({
        data: {
          commentId: commentId,
          userId: currentUserId
        }
      });
      return res.status(201).json({ liked: true, message: 'Comment liked successfully.' });
    }
  } catch (error) {
    next(error);
  }
};
