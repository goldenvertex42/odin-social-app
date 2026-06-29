import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './PostCard.module.css';

export default function PostHeader({ post, currentUserId, onDeleteSuccess, headingLevel = 'h2' }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
  const postAuthorId = typeof post.authorId === 'object' ? post.authorId?.id : post.authorId;

  const isAuthor = String(targetCurrentUserId) === String(postAuthorId);

  const handleDeletePost = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await customFetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (response.ok && onDeleteSuccess) {
        onDeleteSuccess(post.id);
      }
    } catch (err) {
      console.error('System failed to execute post removal sequence:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const Heading = headingLevel;
  
  return (
    <div className={styles.cardHeader}>
      
      <Link 
        to={`/users/${postAuthorId}`} 
        onClick={(e) => e.stopPropagation()} 
        className={styles.authorProfileBlockLink}
        aria-label={`View ${post.author?.displayName || post.author?.username || 'User'}'s profile`}
      >
        <img 
          src={post.author?.avatarUrl} 
          alt="" 
          className={styles.authorAvatar} 
          referrerPolicy="no-referrer" 
        />
        <div className={styles.metaText}>
          <Heading className={styles.authorProfileNameText}>
            {post.author?.displayName || post.author?.username || 'Unknown User'}
          </Heading>
          <time className={styles.postTimestamp} dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString()}
          </time>
        </div>
      </Link>

      {isAuthor && (
        <button
          onClick={handleDeletePost}
          disabled={isDeleting}
          className={styles.deleteButton}
          aria-label={isDeleting ? "Deleting post..." : "Delete post"}
          data-testid="delete-post-btn"
        >
          <Trash2 className={styles.trashIcon} size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
