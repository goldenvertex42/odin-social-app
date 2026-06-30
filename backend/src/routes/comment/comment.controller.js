import { prisma } from '../../../../db/src/index.js';

// 1. CREATE A NEW COMMENT ON A POST
export const createComment = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const targetPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!targetPost) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: currentUserId,
        postId: postId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return res.status(201).json({ message: 'Comment posted successfully.', comment: newComment });
  } catch (error) {
    next(error);
  }
};

// 2. FETCH ALL COMMENTS FOR A SPECIFIC POST (Thread Retrieval)
export const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      orderBy: { 
        createdAt: 'asc'
      },
      include: {
        author: {
          select: { 
            id: true, 
            username: true, 
            displayName: true, 
            avatarUrl: true, 
            isOnline: true 
          }
        },
        likes: true 
      }
    });

    return res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};


// 3. EDIT AN EXISTING COMMENT
export const updateComment = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to edit this comment.' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    return res.status(200).json({ message: 'Comment updated successfully.', comment: updatedComment });
  } catch (error) {
    next(error);
  }
};

// 4. DELETE A COMMENT NATIVELY (Supports Comment Author OR Post Author moderation)
export const deleteComment = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { 
        post: { 
          select: { authorId: true } 
        } 
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const isCommentAuthor = comment.authorId === currentUserId;
    const isPostAuthor = comment.post.authorId === currentUserId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};


