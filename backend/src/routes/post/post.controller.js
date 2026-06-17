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

// 1. FETCH CHRONOLOGICAL SOCIAL FEED
export const getSocialFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const followedRelations = await prisma.follow.findMany({
      where: { followerId: currentUserId, status: 'ACCEPTED' },
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
        _count: {
          select: { likes: true, comments: true },
        },
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
