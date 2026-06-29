import { useState } from 'react';
import { customFetch } from '../../utils/api/api';

/**
 * Custom hook to isolate liking mechanics and interaction states for comments
 * @param {string} commentId - The ID of the comment being interacted with
 * @param {Array} initialLikes - Initial array of like records from the database
 * @param {string|Object} currentUserId - The active session user context identifier
 */
export function useCommentInteraction(commentId, initialLikes = [], currentUserId) {
  const [likes, setLikes] = useState(Array.isArray(initialLikes) ? initialLikes : []);
  const [isLiking, setIsLiking] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;

  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    return String(likeUserId) === String(targetCurrentUserId);
  });

  const toggleCommentLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    try {
      const response = await customFetch(`/api/likes/comment/${commentId}`, { method: 'POST' });
      const data = await response.json();

      if (Array.isArray(data)) {
        setLikes(data);
      } else if (data && typeof data.liked !== 'undefined') {
        if (data.liked) {
          setLikes((prev) => [...prev, { commentId, userId: targetCurrentUserId }]);
        } else {
          setLikes((prev) => prev.filter(like => String(like.userId) !== String(targetCurrentUserId)));
        }
      }
    } catch (err) {
      console.error('Failed to toggle comment level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return {
    likesCount: likes.length,
    hasLiked,
    isLiking,
    toggleCommentLike
  };
}
