import { useState } from 'react';
import { Link } from 'react-router';
import { customFetch } from '../../../utils/api/api';
import styles from './Comment.module.css';

export default function Comment({ comment, currentUserId }) {
  const [likes, setLikes] = useState(Array.isArray(comment.likes) ? comment.likes : []);
  const [isLiking, setIsLiking] = useState(false);

  // Check if the current user has already liked this comment record
  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    const targetUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
    
    return String(likeUserId) === String(targetUserId);
  });

  const handleCommentLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await customFetch(`/api/likes/comment/${comment.id}`, { method: 'POST' });
      const data = await response.json();
      
      // UNPACK & UPDATE: Robustly match both direct arrays or response envelopes
      if (Array.isArray(data)) {
        setLikes(data);
      } else if (data && typeof data.liked !== 'undefined') {
        // If server returns { liked: true/false }, update array footprints locally
        if (data.liked) {
          setLikes((prev) => [...prev, { commentId: comment.id, userId: currentUserId }]);
        } else {
          setLikes((prev) => prev.filter(like => String(like.userId) !== String(currentUserId)));
        }
      }
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
          src={comment.author?.avatarUrl} 
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
