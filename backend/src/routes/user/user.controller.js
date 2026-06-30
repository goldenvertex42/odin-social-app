import { prisma } from '../../../../db/src/index.js';
import cloudinary from 'cloudinary';

const streamUploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'odin_social_avatars',
        transformation: [{ width: 400, height: 400, crop: 'limit' }]
      },
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


// 1. FETCH ALL USERS (WITH FOLLOW STATUS DISCOVERY)
export const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const users = await prisma.user.findMany({
      where: { id: { not: currentUserId } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        colorPalette: true,
        colorScheme: true,
        isOnline: true,
        receivedFollows: { 
          where: { 
            followerId: currentUserId,
            status: { not: 'NOT_FOLLOWING' }
          } 
        },
        sentFollows: { 
          where: { 
            followingId: currentUserId,
            status: { not: 'NOT_FOLLOWING' }
          } 
        }
      }
    });

    const mappedUsers = users.map(user => {
      const outboundingFollow = user.receivedFollows[0]; 
      const inboundingFollow = user.sentFollows[0];      
      let followStatus = 'NOT_FOLLOWING';

      if (outboundingFollow) {
        followStatus = outboundingFollow.status;
      } else if (inboundingFollow) {
        followStatus = inboundingFollow.status;
      }

      const { receivedFollows, sentFollows, ...safeUser } = user;
      return { ...safeUser, followStatus };
    });

    return res.status(200).json(mappedUsers);
  } catch (error) {
    next(error);
  }
};


// 2. GET SINGLE RELATIONSHIP STATE
export const getRelationshipState = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: currentUserId, followingId: targetUserId }
      }
    });

    let relationshipState = 'NOT_FOLLOWING';
    if (followRecord) {
      relationshipState = followRecord.status;
    }

    return res.status(200).json({ relationshipState });
  } catch (error) {
    next(error);
  }
};

// 3. SEND A FOLLOW REQUEST
export const sendFollowRequest = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const targetUserId = req.params.id;

    if (followerId === targetUserId) {
      return res.status(400).json({ message: 'Invalid target user allocation configuration.' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetUserId } }
    });

    if (existingFollow && existingFollow.status !== 'NOT_FOLLOWING') {
      return res.status(400).json({ message: 'A follow link state already exists for this node.' });
    }

    const followRecord = await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId: targetUserId } },
      update: { status: 'REQUEST_SENT' },
      create: { followerId, followingId: targetUserId, status: 'REQUEST_SENT' }
    });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: targetUserId, followingId: followerId } },
      update: { status: 'REQUEST_RECEIVED' },
      create: { followerId: targetUserId, followingId: followerId, status: 'REQUEST_RECEIVED' }
    });

    return res.status(201).json({
      message: 'Follow request sent successfully.',
      status: followRecord.status,
      followRecord
    });
  } catch (error) {
    next(error);
  }
};

// 4. ACCEPT A FOLLOW REQUEST (Resilient Implementation)
export const acceptFollowRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const senderUserId = req.params.id; 

    const followRecord = await prisma.follow.update({
      where: { 
        followerId_followingId: { 
          followerId: senderUserId, 
          followingId: currentUserId 
        } 
      },
      data: { status: 'FOLLOWING' }
    });

    await prisma.follow.upsert({
      where: { 
        followerId_followingId: { 
          followerId: currentUserId, 
          followingId: senderUserId 
        } 
      },
      update: { status: 'FOLLOWING' },
      create: { 
        followerId: currentUserId, 
        followingId: senderUserId, 
        status: 'FOLLOWING' 
      }
    });

    return res.status(200).json({ message: 'Follow request accepted cleanly.', followRecord });
  } catch (error) {
    next(error);
  }
};


// 5. DECLINE, CANCEL, OR UNFOLLOW
export const removeFollowRelationship = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    await prisma.follow.updateMany({
      where: {
        OR: [
          { followerId: currentUserId, followingId: targetUserId },
          { followerId: targetUserId, followingId: currentUserId }
        ]
      },
      data: { status: 'NOT_FOLLOWING' }
    });

    return res.status(200).json({ success: true, message: 'Follow state row disconnected successfully.' });
  } catch (error) {
    next(error);
  }
};

// 6. UPDATE USER PROFILE AND THEME PREFERENCES
export const updateProfile = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { displayName, bio, colorPalette, colorScheme, email } = req.body;
    const validPalettes = ['default', 'cyberpunk', 'nord', 'sunset', 'obsidian', 'neonmint'];
    const validSchemes = ['light', 'dark'];

    if (colorPalette && !validPalettes.includes(colorPalette)) {
      return res.status(400).json({ message: 'Invalid color palette configuration selection.' });
    }

    if (colorScheme && !validSchemes.includes(colorScheme)) {
      return res.status(400).json({ message: 'Invalid color scheme luminosity selection.' });
    }

    if (email) {
      const emailOwner = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase(), id: { not: currentUserId } }
      });
      if (emailOwner) {
        return res.status(400).json({ message: 'Email address is already linked to another account.' });
      }
    }

    let customAvatarUrl = undefined;
    if (req.file) {
      try {
        customAvatarUrl = await streamUploadToCloudinary(req.file.buffer);
      } catch (cloudinaryError) {
        return res.status(500).json({ message: 'Failed to upload new avatar asset to cloud media bucket.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        email: email ? email.trim().toLowerCase() : undefined,
        displayName: displayName !== undefined ? displayName.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        avatarUrl: customAvatarUrl || undefined,
        colorPalette: colorPalette || undefined,
        colorScheme: colorScheme || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        colorPalette: true,
        colorScheme: true,
        isOnline: true,
        isGuest: true
      }
    });

    return res.status(200).json({ message: 'Profile configuration updated successfully.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// 7. FETCH A SINGLE USER PROFILE
export const getSingleUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      const selfProfile = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, colorPalette: true, colorScheme: true, isOnline: true }
      });
      if (!selfProfile) return res.status(404).json({ message: 'User not found.' });
      return res.status(200).json({ ...selfProfile, relationshipStatus: 'SELF' });
    }

    const targetProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        colorPalette: true,
        colorScheme: true,
        isOnline: true,
        receivedFollows: { 
          where: { 
            followerId: currentUserId,
            status: { not: 'NOT_FOLLOWING' }
          } 
        },
        sentFollows: { 
          where: { 
            followingId: currentUserId,
            status: { not: 'NOT_FOLLOWING' }
          } 
        }
      }
    });

    if (!targetProfile) {
      return res.status(404).json({ message: 'Target profile records not found.' });
    }

    let relationshipStatus = 'NOT_FOLLOWING';
    const outboundingFollow = targetProfile.receivedFollows[0]; 
    const inboundingFollow = targetProfile.sentFollows[0];      

    if (outboundingFollow) {
      relationshipStatus = outboundingFollow.status;
    } else if (inboundingFollow) {
      relationshipStatus = inboundingFollow.status;
    }

    const { receivedFollows, sentFollows, ...safeProfile } = targetProfile;
    return res.status(200).json({ ...safeProfile, relationshipStatus });
  } catch (error) {
    next(error);
  }
};

// 8. DELETE A USER ACCOUNT
export const deleteAccount = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { posts: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Target profile records not found.' });
    }

    if (user.avatarUrl && !user.avatarUrl.includes('gravatar.com') && !user.avatarUrl.includes('googleusercontent.com')) {
      const avatarPublicId = getCloudinaryPublicId(user.avatarUrl);
      if (avatarPublicId) {
        await cloudinary.v2.uploader.destroy(avatarPublicId);
      }
    }

    for (const post of user.posts) {
      if (post.imageUrl) {
        const postPublicId = getCloudinaryPublicId(post.imageUrl);
        if (postPublicId) {
          await cloudinary.v2.uploader.destroy(postPublicId);
        }
      }
    }

    await prisma.user.delete({ where: { id: currentUserId } });
    
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};