import { useState } from 'react';
import { Link } from 'react-router';
import customFetch from '../../../utils/api/api';
import CommentThread from '../CommentThread/CommentThread';
import styles from './PostCard.module.css';

export default function PostCard({ post, currentUserId }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [isLiking, setIsLiking] = useState(false);

  // Check if the current user has already liked this post profile
  const hasLiked = likes.some(like => like.userId === currentUserId);

  const handlePostLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      // Direct integration with your explicit backend route matrix
      const updatedLikes = await customFetch(`api/likes/post/${post.id}`, {
        method: 'POST'
      });
      setLikes(updatedLikes);
    } catch (err) {
      console.error('Failed to toggle post level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article className={styles.cardContainer} data-testid="post-card">
      {/* Meta User Profile Header Section */}
      <header className={styles.cardHeader}>
        <img 
          src={post.author?.avatarUrl || '/default-avatar.svg'} 
          alt="" 
          className={styles.authorAvatar} 
        />
        <div className={styles.metaText}>
          <Link to={`/users/${post.authorId}`} className={styles.authorProfileLink}>
            {post.author?.displayName || 'Unknown User'}
          </Link>
          <time className={styles.postTimestamp} dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString()}
          </time>
        </div>
      </header>

      {/* Main Core Content Layout Canvas */}
      <div className={styles.cardBody}>
        <p className={styles.textContent}>{post.content}</p>
        {post.imageUrl && (
          <div className={styles.imageWrapper}>
            <img src={post.imageUrl} alt="User published media asset" className={styles.mediaAsset} />
          </div>
        )}
      </div>

      {/* Action Footer Controls Panel */}
      <footer className={styles.cardFooter}>
        <button 
          onClick={handlePostLikeToggle} 
          disabled={isLiking}
          className={`${styles.likeActionButton} ${hasLiked ? styles.activeLikedState : ''}`}
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          <span className={styles.actionIcon} aria-hidden="true">👍</span> 
          <span className={styles.actionLabel}>
            {hasLiked ? 'Liked' : 'Like'} ({likes.length})
          </span>
        </button>
      </footer>

      {/* Nested Interaction Comment Flow Area */}
      <section className={styles.commentThreadSection} aria-label="Post replies stream">
        <h4 className={styles.commentStreamTitle}>
          Comments ({post.comments?.length || 0})
        </h4>
        <CommentThread comments={post.comments} currentUserId={currentUserId} />
      </section>
    </article>
  );
}
