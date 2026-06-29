import { useState } from 'react';
import { customFetch } from '../../utils/api/api';

/**
 * Custom hook to isolate liking mechanics and interaction states for posts
 */
export function usePostInteraction(postId, initialLikes = [], currentUserId) {
  const [likes, setLikes] = useState(Array.isArray(initialLikes) ? initialLikes : []);
  const [isLiking, setIsLiking] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;

  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    return String(likeUserId) === String(targetCurrentUserId);
  });

  const toggleLike = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isLiking) return;

    try {
      setIsLiking(true);
      const response = await customFetch(`/api/likes/post/${postId}`, { method: 'POST' });
      const updatedLikes = await response.json();
      setLikes(Array.isArray(updatedLikes) ? updatedLikes : []);
    } catch (err) {
      console.error('Failed to toggle post level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return {
    likesCount: likes.length,
    hasLiked,
    isLiking,
    toggleLike
  };
}
