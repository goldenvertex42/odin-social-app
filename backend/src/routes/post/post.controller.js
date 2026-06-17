import { prisma } from '../../../../db/src/index.js';

// 1. FETCH CHRONOLOGICAL SOCIAL FEED
export const getSocialFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // A. Query the database to find all users that the current user is FOLLOWING
    const followedRelations = await prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        status: 'ACCEPTED',
      },
      select: {
        followingId: true,
      },
    });

    // B. Flatten the relations array into a clean list of ID strings
    const followedUserIds = followedRelations.map((rel) => rel.followingId);

    // C. Combine followed IDs with the user's own ID to include self-authored posts
    const feedAuthorIds = [...followedUserIds, currentUserId];

    // D. Fetch the final post array utilizing clean relational inclusion blocks
    const feedPosts = await prisma.post.findMany({
      where: {
        authorId: {
          in: feedAuthorIds,
        },
      },
      orderBy: {
        createdAt: 'desc', // Forces chronological sorting order
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isOnline: true,
          },
        },
        _count: {
          select: {
            likes: true,    // Matches your PostLike explicit model
            comments: true, // Matches your Comment explicit model
          },
        },
      },
    });

    return res.status(200).json(feedPosts);
  } catch (error) {
    next(error);
  }
};

// 2. CREATE A NEW POST NODE
export const createPost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { content, imageUrl } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        authorId: currentUserId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json({ message: 'Post published successfully.', post: newPost });
  } catch (error) {
    console.error("❌ PRISMA CREATION ERROR DETECTED:", error); 
    next(error);
  }
};

// 3. EDIT AN EXISTING POST
export const updatePost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;
    const { content, imageUrl } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    // Find the post to verify current existence and author footprint
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    // Strict authorship gatekeeper check
    if (post.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to edit this post.' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { 
        content: content.trim(),
        imageUrl: imageUrl || null
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    return res.status(200).json({ message: 'Post updated successfully.', post: updatedPost });
  } catch (error) {
    next(error);
  }
};

// 4. DELETE A POST NATIVELY
export const deletePost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    // Strict authorship gatekeeper check
    if (post.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post.' });
    }

    // Delete query cleanly triggers cascade rules inside schema.prisma for likes/comments
    await prisma.post.delete({
      where: { id: postId }
    });

    return res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

