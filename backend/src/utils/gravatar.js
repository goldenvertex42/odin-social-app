import crypto from 'crypto';

/**
 * Generates a secure SHA-256 Gravatar URL based on a user's email string.
 * @param {string} email - The user's input email address.
 * @returns {string} - Complete Gravatar image target path string.
 */
export const getGravatarUrl = (email) => {
  // Gravatar specification: lowercase, trim whitespace, and hash with SHA-256
  const cleanEmail = email.trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(cleanEmail).digest('hex');

  // d=retro acts as a default fallback generation parameter for unregistered users.
  // Options include: identicon, monsterid, wavatar, retro, robohash
  return `https://gravatar.com/${hash}?d=identicon&s=200`;
};
