import { useState } from 'react';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './PostCard.module.css';

export default function PostActions({ postId, initialLikes, currentUserId, isStandaloneView }) {
  const [likes, setLikes] = useState(Array.isArray(initialLikes) ? initialLikes : []);
  const [isLiking, setIsLiking] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;

  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    return String(likeUserId) === String(targetCurrentUserId);
  });

  const handlePostLikeToggle = async (e) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await customFetch(`/api/likes/post/${postId}`, { method: 'POST' });
      const updatedLikes = await response.json();
      setLikes(Array.isArray(updatedLikes) ? updatedLikes : []);
    } catch (err) {
      console.error('Failed to toggle post level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <footer className={styles.cardFooter}>
      <button 
        onClick={handlePostLikeToggle} 
        disabled={isLiking} 
        className={`${styles.likeActionButton} ${hasLiked ? styles.activeLikedState : ''}`} 
        aria-label={hasLiked ? "Unlike post" : "Like post"} 
      >
        <ThumbsUp className={styles.actionIcon} size={16} aria-hidden="true" fill={hasLiked ? "currentColor" : "none"} />
        <span className={styles.actionLabel}>
          {hasLiked ? 'Liked' : 'Like'} ({likes.length})
        </span>
      </button>

      {!isStandaloneView && (
        <button className={styles.threadLinkBtn} aria-label="Open full discussion thread">
          <MessageSquare className={styles.actionIcon} size={16} aria-hidden="true" />
          <span className={styles.actionLabel}>View Full Thread</span>
        </button>
      )}
    </footer>
  );
}
