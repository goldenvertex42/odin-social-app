import { prisma } from '../../../../db/src/index.js';

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
    const { displayName, bio, colorPalette, colorScheme } = req.body;

    // Validate enum boundaries for color choices if they are provided
    const validPalettes = ['default', 'cyberpunk', 'nord', 'sunset'];
    const validSchemes = ['light', 'dark'];

    if (colorPalette && !validPalettes.includes(colorPalette)) {
      return res.status(400).json({ message: 'Invalid color palette configuration selection.' });
    }

    if (colorScheme && !validSchemes.includes(colorScheme)) {
      return res.status(400).json({ message: 'Invalid color scheme luminosity selection.' });
    }

    // Perform the update using Prisma's selective data assignment
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        // Fallback to existing values if not provided in request body
        displayName: displayName !== undefined ? displayName.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
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
