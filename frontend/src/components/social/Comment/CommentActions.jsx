import { Heart } from 'lucide-react';
import { useCommentInteraction } from '../../../hooks/useCommentInteraction/useCommentInteraction';
import styles from './Comment.module.css';

export default function CommentActions({ commentId, initialLikes, currentUserId }) {
  const { likesCount, hasLiked, isLiking, toggleCommentLike } = useCommentInteraction(commentId, initialLikes, currentUserId);

  return (
    <footer className={styles.commentFooter}>
      <button 
        onClick={toggleCommentLike} 
        disabled={isLiking} 
        className={`${styles.likeButton} ${hasLiked ? styles.activeLikedState : ''}`} 
        aria-label={hasLiked ? "Unlike comment" : "Like comment"}
      >
        <Heart className={styles.heartIcon} size={14} aria-hidden="true" fill={hasLiked ? "currentColor" : "none"} />
        <span className={styles.likeCounter}>{likesCount}</span>
      </button>
    </footer>
  );
}
