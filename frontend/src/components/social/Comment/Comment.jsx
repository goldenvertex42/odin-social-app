import { useState } from 'react';
import { Link } from 'react-router';
import customFetch from '../../../utils/api/api';
import styles from './Comment.module.css';

export default function Comment({ comment, currentUserId }) {
  const [likes, setLikes] = useState(comment.likes || []);
  const [isLiking, setIsLiking] = useState(false);

  // Check if the current user has already liked this comment record
  const hasLiked = likes.some(like => like.userId === currentUserId);

  const handleCommentLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      // Connects directly to your exact backend route matrix endpoint
      const updatedLikes = await customFetch(`api/likes/comment/${comment.id}`, {
        method: 'POST'
      });
      setLikes(updatedLikes);
    } catch (err) {
      console.error('Failed to toggle comment level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className={styles.commentContainer} data-testid="comment-node">
      <header className={styles.commentHeader}>
        <img 
          src={comment.author?.avatarUrl || '/default-avatar.svg'} 
          alt="" 
          className={styles.commentAvatar} 
        />
        <div className={styles.metaBlock}>
          <Link to={`/users/${comment.authorId}`} className={styles.authorProfileLink}>
            {comment.author?.displayName || 'Unknown User'}
          </Link>
          <span className={styles.timestamp}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      <div className={styles.commentBody}>
        <p className={styles.contentParagraph}>{comment.content}</p>
      </div>

      <footer className={styles.commentFooter}>
        <button 
          onClick={handleCommentLikeToggle} 
          disabled={isLiking}
          className={`${styles.likeButton} ${hasLiked ? styles.activeLikedState : ''}`}
          aria-label={hasLiked ? "Unlike comment" : "Like comment"}
        >
          <span className={styles.heartIcon} aria-hidden="true">❤️</span>
          <span className={styles.likeCounter}>{likes.length}</span>
        </button>
      </footer>
    </div>
  );
}
