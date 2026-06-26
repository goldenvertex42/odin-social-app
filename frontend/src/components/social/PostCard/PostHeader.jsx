import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './PostCard.module.css';

export default function PostHeader({ post, currentUserId, onDeleteSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
  const postAuthorId = typeof post.authorId === 'object' ? post.authorId?.id : post.authorId;

  const isAuthor = String(targetCurrentUserId) === String(postAuthorId);

  const handleDeletePost = async (e) => {
    e.stopPropagation(); // Stop macro card navigation bubbling redirect
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

  return (
    <header className={styles.cardHeader}>
      <div className={styles.userInfoBlock}>
        <Link to={`/users/${postAuthorId}`} onClick={(e) => e.stopPropagation()} className={styles.avatarLink}>
          <img 
            src={post.author?.avatarUrl} 
            alt={`${post.author?.displayName || 'User'}'s profile avatar`} 
            className={styles.authorAvatar} 
            referrerPolicy="no-referrer" 
          />
        </Link>
        <div className={styles.metaText}>
          <Link to={`/users/${postAuthorId}`} onClick={(e) => e.stopPropagation()} className={styles.authorProfileLink}>
            {post.author?.displayName || post.author?.username || 'Unknown User'}
          </Link>
          <time className={styles.postTimestamp} dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString()}
          </time>
        </div>
      </div>

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
    </header>
  );
}
