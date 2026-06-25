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

    // Verify the target post exists before attempting insertion
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
        createdAt: 'asc' // Threaded discussions read chronologically forward 
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

    // Find the comment and check ownership
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

    // We must include the parent Post relation to check who owns the thread anchor
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            authorId: true // Fetches the ID of the person who wrote the post
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Determine authorization states
    const isCommentAuthor = comment.authorId === currentUserId;
    const isPostAuthor = comment.post.authorId === currentUserId;

    // ⚠️ Security Guard: If you are NEITHER author, you are blocked
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return res.status(200).json({ 
      success: true, 
      message: isPostAuthor 
        ? 'Comment moderated and removed by post author.' 
        : 'Comment deleted successfully by author.' 
    });
  } catch (error) {
    next(error);
  }
};

