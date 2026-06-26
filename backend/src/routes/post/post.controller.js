import { prisma } from '../../../../db/src/index.js';
import cloudinary from 'cloudinary';

// Unified Cloudinary helper to stream memory buffers for post content
const streamPostImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'odin_social_post_images',
        transformation: [{ width: 1200, crop: 'limit' }]
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Extract Cloudinary Public ID utility for safe asset clearing
const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  
  try {
    const parts = url.split('/');
    const filePart = parts[parts.length - 1].split('.')[0];
    const folderPart = parts[parts.length - 2];

    // If the image is housed in one of your two active folder namespaces, prepend it
    if (folderPart === 'odin_social_avatars' || folderPart === 'odin_social_post_images') {
      return `${folderPart}/${filePart}`;
    }

    // Standard fallback loop for root-level assets
    return filePart;
  } catch (error) {
    console.error('Failed to parse Cloudinary public_id out of resource URL payload:', error);
    return null;
  }
};


// 1. FETCH CHRONOLOGICAL SOCIAL FEED
export const getSocialFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Discover who the current session user is actively tracking using the new alignment enums
    const followedRelations = await prisma.follow.findMany({
      where: { 
        followerId: currentUserId, 
        status: 'FOLLOWING' // Aligned with the four-part state configuration
      },
      select: { followingId: true },
    });

    const followedUserIds = followedRelations.map((rel) => rel.followingId);
    const feedAuthorIds = [...followedUserIds, currentUserId];

    const feedPosts = await prisma.post.findMany({
      where: { authorId: { in: feedAuthorIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
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

// 2. CREATE A NEW POST NODE (With Complete Array Pre-Hydration)
export const createPost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

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
        imageUrl: uploadedImageUrl,
        authorId: currentUserId,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        likes: true,
        comments: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
          }
        }
      },
    });

    return res.status(201).json({ message: 'Post published successfully.', post: newPost });
  } catch (error) {
    next(error);
  }
};


// 3. EDIT AN EXISTING POST
export const updatePost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;
    const { content, removeImage } = req.body;

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

    let targetImageUrl = post.imageUrl;
    if (req.file) {
      try {
        // Purge old asset from Cloudinary nodes if replacing it with a fresh file upload
        if (post.imageUrl) {
          const publicId = getCloudinaryPublicId(post.imageUrl);
          if (publicId) await cloudinary.v2.uploader.destroy(publicId);
        }
        targetImageUrl = await streamPostImageToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to update post image asset.' });
      }
    } else if (removeImage === 'true') {
      if (post.imageUrl) {
        const publicId = getCloudinaryPublicId(post.imageUrl);
        if (publicId) await cloudinary.v2.uploader.destroy(publicId);
      }
      targetImageUrl = null;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content: content.trim(), imageUrl: targetImageUrl },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });

    return res.status(200).json({ message: 'Post updated successfully.', post: updatedPost });
  } catch (error) {
    next(error);
  }
};

// 4. DELETE A POST NATIVELY (With Complete Phase 2 Binary Clearing)
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

    // Phase 2 Cleanup: Purge binary files from Cloudinary storage nodes instantly
    if (post.imageUrl) {
      const publicId = getCloudinaryPublicId(post.imageUrl);
      if (publicId) {
        await cloudinary.v2.uploader.destroy(publicId);
      }
    }

    await prisma.post.delete({ where: { id: postId } });
    return res.status(204).send(); // Standard non-content transaction finish
  } catch (error) {
    next(error);
  }
};

// 5. FETCH CHRONOLOGICAL POSTS FOR A SINGLE TARGET USER
export const getUserPosts = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user profile records not found.' });
    }

    const userPosts = await prisma.post.findMany({
      where: { authorId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
          }
        }
      },
    });

    return res.status(200).json(userPosts);
  } catch (error) {
    next(error);
  }
};

// 6. FETCH A SINGLE DEEP-LINKED POST THREAD
export const getSinglePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true },
        },
        likes: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            likes: true
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
