import { prisma } from '../../../../db/src/index.js';
import cloudinary from 'cloudinary';

// Unified Cloudinary helper to stream memory buffers for post content
const streamPostImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder: 'odin_social_post_images', transformation: [{ width: 1200, crop: 'limit' }] },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const filePart = parts[parts.length - 1].split('.')[0];
    const folderPart = parts[parts.length - 2];
    if (folderPart === 'odin_social_avatars' || folderPart === 'odin_social_post_images') {
      return `${folderPart}/${filePart}`;
    }
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
    const followedRelations = await prisma.follow.findMany({
      where: { followerId: currentUserId, status: 'FOLLOWING' },
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

// 2. CREATE A NEW POST NODE (Text-Optional, Image-Optional)
export const createPost = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { content } = req.body;
    
    const hasText = content && content.trim() !== '';
    const hasFile = !!req.file;

    if (!hasText && !hasFile) {
      return res.status(400).json({ message: 'Cannot publish an empty post. Provide text copy or an image upload.' });
    }

    let uploadedImageUrl = null;
    if (hasFile) {
      try {
        uploadedImageUrl = await streamPostImageToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to upload post image to cloud media bucket.' });
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: hasText ? content.trim() : '',
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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Target post not found.' });
    }
    if (post.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Unauthorized to edit this post.' });
    }

    let targetImageUrl = post.imageUrl;
    let isImageRemoved = removeImage === 'true';

    if (req.file) {
      isImageRemoved = false;
    }

    const finalImageWillExist = (req.file || (post.imageUrl && !isImageRemoved));
    const finalHasText = content && content.trim() !== '';

    if (!finalHasText && !finalImageWillExist) {
      return res.status(400).json({ message: 'Post cannot be updated to be completely empty.' });
    }

    if (req.file) {
      try {
        if (post.imageUrl) {
          const publicId = getCloudinaryPublicId(post.imageUrl);
          if (publicId) await cloudinary.v2.uploader.destroy(publicId);
        }
        targetImageUrl = await streamPostImageToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to update post image asset.' });
      }
    } else if (isImageRemoved) {
      if (post.imageUrl) {
        const publicId = getCloudinaryPublicId(post.imageUrl);
        if (publicId) await cloudinary.v2.uploader.destroy(publicId);
      }
      targetImageUrl = null;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: finalHasText ? content.trim() : '',
        imageUrl: targetImageUrl
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
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
    if (post.imageUrl) {
      const publicId = getCloudinaryPublicId(post.imageUrl);
      if (publicId) {
        await cloudinary.v2.uploader.destroy(publicId);
      }
    }
    await prisma.post.delete({ where: { id: postId } });
    return res.status(204).send();
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
          include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
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
