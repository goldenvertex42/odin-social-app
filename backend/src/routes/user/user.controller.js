import { prisma } from '../../../../db/src/index.js';
import cloudinary from 'cloudinary';

const streamUploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'odin_social_avatars', // Group user icons into a clean separate directory
        transformation: [{ width: 400, height: 400, crop: 'limit' }] // Auto-downscale high-res images
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    uploadStream.end(fileBuffer);
  });
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
          where: { followerId: currentUserId } 
        }
      }
    });

    const mappedUsers = users.map(user => {
      const followRelationship = user.receivedFollows[0];
      let followStatus = 'NONE';

      if (followRelationship) {
        if (followRelationship.status === 'ACCEPTED') {
          followStatus = 'FOLLOWING';
        } else if (followRelationship.status === 'PENDING') {
          followStatus = 'PENDING';
        }
      }

      const { receivedFollows, ...safeUser } = user;
      return { ...safeUser, followStatus };
    });

    return res.status(200).json(mappedUsers);
  } catch (error) {
    next(error);
  }
};

// 2. GET SINGLE RELATIONSHIP STATE (Matches the test lookup endpoint)
export const getRelationshipState = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    let relationshipState = 'NONE';
    if (followRecord) {
      relationshipState = followRecord.status === 'ACCEPTED' ? 'FOLLOWING' : 'PENDING';
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
    const targetUserId = req.params.id; // Shifted from req.body to route param

    if (followerId === targetUserId) {
      return res.status(400).json({ message: 'Invalid target user allocation configuration.' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetUserId } }
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'A follow link state already exists for this node.' });
    }

    const followRecord = await prisma.follow.create({
      data: { followerId, followingId: targetUserId, status: 'PENDING' }
    });

    // Added explicit status flag return to directly satisfy the test case
    return res.status(201).json({ 
      message: 'Follow request sent successfully.', 
      status: followRecord.status, 
      followRecord 
    });
  } catch (error) {
    next(error);
  }
};

// 4. ACCEPT A FOLLOW REQUEST
export const acceptFollowRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const senderUserId = req.params.id; // Shifted from req.body to route param

    const followRecord = await prisma.follow.update({
      where: { followerId_followingId: { followerId: senderUserId, followingId: currentUserId } },
      data: { status: 'ACCEPTED' }
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
    const targetUserId = req.params.id; // Shifted from req.body to route param

    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: currentUserId, followingId: targetUserId },
          { followerId: targetUserId, followingId: currentUserId }
        ]
      }
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

    const validPalettes = ['default', 'cyberpunk', 'nord', 'sunset'];
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

    // ⚠️ CRITICAL UX ADDITION: Intercept and process incoming custom avatar files
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
        avatarUrl: customAvatarUrl || undefined, // Overwrites with your new custom Cloudinary target path
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

    return res.status(200).json({ 
      message: 'Profile configuration updated successfully.', 
      user: updatedUser 
    });
  } catch (error) {
    next(error);
  }
};

// 7. FETCH A SINGLE USER PROFILE (WITH CALCULATED RELATIONSHIP STATE)
export const getSingleUser = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    // Handle self lookup profile edge case smoothly
    if (currentUserId === targetUserId) {
      const selfProfile = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          colorPalette: true,
          colorScheme: true,
          isOnline: true
        }
      });
      if (!selfProfile) return res.status(404).json({ message: 'User not found.' });
      return res.status(200).json({ ...selfProfile, relationshipStatus: 'SELF' });
    }

    // Query profile details alongside relationship records simultaneously
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
        // Check if the current user is following them
        receivedFollows: {
          where: { followerId: currentUserId }
        },
        // Check if they are following the current user
        sentFollows: {
          where: { followingId: currentUserId }
        }
      }
    });

    if (!targetProfile) {
      return res.status(404).json({ message: 'Target profile records not found.' });
    }

    // Decode the relational rows directly into your explicit four-stage status machine
    let relationshipStatus = 'NOT_FOLLOWING';
    const outboundingFollow = targetProfile.receivedFollows[0]; // Current user -> Target
    const inboundingFollow = targetProfile.sentFollows[0];     // Target -> Current user

    if (outboundingFollow) {
      relationshipStatus = outboundingFollow.status === 'ACCEPTED' ? 'FOLLOWING' : 'REQUEST_SENT';
    } else if (inboundingFollow) {
      relationshipStatus = inboundingFollow.status === 'ACCEPTED' ? 'FOLLOWING' : 'REQUEST_RECEIVED';
    }

    // Strip out raw relation arrays to return a clean safe payload
    const { receivedFollows, sentFollows, ...safeProfile } = targetProfile;

    return res.status(200).json({
      ...safeProfile,
      relationshipStatus
    });
  } catch (error) {
    next(error);
  }
};
