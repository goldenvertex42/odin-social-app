import { useState } from 'react';
import { Heart } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './Comment.module.css';

export default function CommentActions({ commentId, initialLikes, currentUserId }) {
  const [likes, setLikes] = useState(Array.isArray(initialLikes) ? initialLikes : []);
  const [isLiking, setIsLiking] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;

  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    return String(likeUserId) === String(targetCurrentUserId);
  });

  const handleCommentLikeToggle = async () => {
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

  return (
    <footer className={styles.commentFooter}>
      <button 
        onClick={handleCommentLikeToggle} 
        disabled={isLiking} 
        className={`${styles.likeButton} ${hasLiked ? styles.activeLikedState : ''}`} 
        aria-label={hasLiked ? "Unlike comment" : "Like comment"} 
      >
        <Heart className={styles.heartIcon} size={14} aria-hidden="true" fill={hasLiked ? "currentColor" : "none"} />
        <span className={styles.likeCounter}>{likes.length}</span>
      </button>
    </footer>
  );
}
