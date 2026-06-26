import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { customFetch } from '../../../utils/api/api';
import CommentThread from '../CommentThread/CommentThread';
import styles from './PostCard.module.css';

import { ThumbsUp, MessageSquare } from 'lucide-react';

export default function PostCard({ post, currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isStandaloneView = location.pathname === `/posts/${post.id}`;

  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes : []);
  const [isLiking, setIsLiking] = useState(false);

  const hasLiked = likes.some(like => {
    const likeUserId = typeof like.userId === 'object' ? like.userId?.id : like.userId;
    const targetUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
    return String(likeUserId) === String(targetUserId);
  });

  const handlePostLikeToggle = async (e) => {
    e.stopPropagation();

    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await customFetch(`/api/likes/post/${post.id}`, { method: 'POST' });
      const updatedLikes = await response.json();
      setLikes(Array.isArray(updatedLikes) ? updatedLikes : []);
    } catch (err) {
      console.error('Failed to toggle post level like state:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCardNavigation = () => {
    if (!isStandaloneView) {
      navigate(`/posts/${post.id}`);
    }
  };

  return (
    <article 
      onClick={handleCardNavigation}
      className={`${styles.cardContainer} ${!isStandaloneView ? styles.clickableCard : ''}`} 
      data-testid="post-card"
    >
      <header className={styles.cardHeader}>
        <Link to={`/users/${post.authorId}`} onClick={(e) => e.stopPropagation()} className={styles.avatarLink}>
          <img 
            src={post.author?.avatarUrl || '/default-avatar.svg'} 
            alt={`${post.author?.displayName || 'User'}'s profile avatar`} 
            className={styles.authorAvatar} 
          />
        </Link>
        <div className={styles.metaText}>
          <Link to={`/users/${post.authorId}`} onClick={(e) => e.stopPropagation()} className={styles.authorProfileLink}>
            {post.author?.displayName || post.author?.username || 'Unknown User'}
          </Link>
          <time className={styles.postTimestamp} dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString()}
          </time>
        </div>
      </header>

      <div className={styles.cardBody}>
        <p className={styles.textContent}>{post.content}</p>
        {post.imageUrl && (
          <div className={styles.imageWrapper}>
            <img 
              src={post.imageUrl} 
              alt="User published media asset" 
              className={styles.mediaAsset} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <footer className={styles.cardFooter}>
        <button 
          onClick={handlePostLikeToggle} 
          disabled={isLiking} 
          className={`${styles.likeActionButton} ${hasLiked ? styles.activeLikedState : ''}`}
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          <ThumbsUp 
            className={styles.actionIcon} 
            size={16} 
            aria-hidden="true" 
            fill={hasLiked ? "currentColor" : "none"} 
          />
          <span className={styles.actionLabel}>
            {hasLiked ? 'Liked' : 'Like'} ({likes.length})
          </span>
        </button>

        {!isStandaloneView && (
          <button className={styles.threadLinkBtn} aria-label="Open full discussion thread">
            {/* FIXED: Swapped raw speech bubble emoji for a high-end discussion vector icon */}
            <MessageSquare className={styles.actionIcon} size={16} aria-hidden="true" />
            <span className={styles.actionLabel}>View Full Thread</span>
          </button>
        )}
      </footer>

      <section className={styles.commentThreadSection} aria-label="Post replies stream" onClick={(e) => e.stopPropagation()}>
        <h4 className={styles.commentStreamTitle}>
          Comments ({post.comments?.length || 0})
        </h4>
        <CommentThread postId={post.id} comments={post.comments} currentUserId={currentUserId} />
      </section>
    </article>
  );
}
