import { prisma } from '../../../../db/src/index.js';
import cloudinary from 'cloudinary';

// Unified Cloudinary helper to stream memory buffers for post content
const streamPostImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'odin_social_post_images', // Dedicated post media cloud storage folder
        transformation: [{ width: 1200, crop: 'limit' }] // Cap wide images for performance, preserve aspect ratio
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// 1. FETCH CHRONOLOGICAL SOCIAL FEED (UPDATED WITH ARRAY INCLUSIONS)
export const getSocialFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Discover who the current session user is following
    const followedRelations = await prisma.follow.findMany({
      where: { followerId: currentUserId, status: 'ACCEPTED' },
      select: { followingId: true },
    });

    const followedUserIds = followedRelations.map((rel) => rel.followingId);
    // Combine followed IDs with current user ID to form full feed target bounds
    const feedAuthorIds = [...followedUserIds, currentUserId];

    const feedPosts = await prisma.post.findMany({
      where: { authorId: { in: feedAuthorIds } },
      orderBy: { createdAt: 'desc' }, // Descending chronological index order
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true, 
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true }
            },
            likes: true
          }
        }
      },
    });

    return res.status(200).json(feedPosts);
  } catch (error) {
    next(error);
  }
};


// 2. CREATE A NEW POST NODE (With Direct Cloudinary Stream Integration)
export const createPost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    // Process the image file upload if the user attached one
    let uploadedImageUrl = null;
    if (req.file) {
      try {
        uploadedImageUrl = await streamPostImageToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to upload post image to cloud media bucket.' });
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: uploadedImageUrl, // Saves secure URL from Cloudinary
        authorId: currentUserId,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json({ message: 'Post published successfully.', post: newPost });
  } catch (error) {
    next(error);
  }
};

// 3. EDIT AN EXISTING POST (Allows Uploading a New Image)
export const updatePost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;
    const { content, removeImage } = req.body; // removeImage allows resetting media

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    if (post.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to edit this post.' });
    }

    // Determine target imageUrl state logic
    let targetImageUrl = post.imageUrl;
    
    if (req.file) {
      try {
        targetImageUrl = await streamPostImageToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to update post image asset.' });
      }
    } else if (removeImage === 'true') {
      targetImageUrl = null; // Purge image if flag is set explicitly
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
        imageUrl: targetImageUrl
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

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: 'Target post not found.' });
    }

    if (post.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post.' });
    }

    await prisma.post.delete({ where: { id: postId } });
    return res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 5. FETCH CHRONOLOGICAL POSTS FOR A SINGLE TARGET USER
export const getUserPosts = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Optional validation guard: Verify target user exists before processing posts
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user profile records not found.' });
    }

    const userPosts = await prisma.post.findMany({
      where: { authorId: targetUserId },
      orderBy: { createdAt: 'desc' }, // Descending chronological index order
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true, // Crucial: satisfy frontend likes.some() and likes.length counters
        comments: {
          orderBy: { createdAt: 'desc' }, // Order leaf replies chronologically descending
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true }
            }
          }
        }
      },
    });

    return res.status(200).json(userPosts);
  } catch (error) {
    next(error);
  }
};

// 6. FETCH A SINGLE DEEP-LINKED POST THREAD WITH RICH DATA HYDRATION
export const getSinglePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true, // Post Likes Array for frontend .some() evaluation
        comments: {
          orderBy: { createdAt: 'desc' }, // Displays thread replies chronologically descending
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true }
            },
            likes: true // Comment Likes Array for nested leaf comment nodes
          }
        }
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'The requested post could not be found.' });
    }

    return res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};
