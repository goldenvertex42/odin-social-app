import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import CommentActions from './CommentActions';
import styles from './Comment.module.css';

export default function Comment({ comment, currentUserId, postOwnerId, onDeleteSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
  const commentAuthorId = typeof comment.authorId === 'object' ? comment.authorId?.id : comment.authorId;
  const parentPostOwnerId = typeof postOwnerId === 'object' ? postOwnerId?.id : postOwnerId;

  // Access Guard Evaluation
  const canDelete = String(targetCurrentUserId) === String(commentAuthorId) || 
                    String(targetCurrentUserId) === String(parentPostOwnerId);

  const handleDeleteComment = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await customFetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
      if (response.ok && onDeleteSuccess) {
        onDeleteSuccess(comment.id);
      }
    } catch (err) {
      console.error('System failed to execute comment drop target:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.commentContainer} data-testid="comment-node">
      <header className={styles.commentHeader}>
        <div className={styles.userInfoBlock}>
          <img 
            src={comment.author?.avatarUrl} 
            alt={`${comment.author?.displayName || 'User'}'s profile avatar`} 
            className={styles.commentAvatar} 
            referrerPolicy="no-referrer" 
          />
          <div className={styles.metaBlock}>
            <Link to={`/users/${commentAuthorId}`} className={styles.authorProfileLink}>
              {comment.author?.displayName || 'Unknown User'}
            </Link>
            <span className={styles.timestamp}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDeleteComment}
            disabled={isDeleting}
            className={styles.deleteButton}
            aria-label={isDeleting ? "Deleting comment..." : "Delete comment"}
            data-testid="delete-comment-btn"
          >
            <Trash2 className={styles.trashIcon} size={14} aria-hidden="true" />
          </button>
        )}
      </header>
      
      <div className={styles.commentBody}>
        <p className={styles.contentParagraph}>{comment.content}</p>
      </div>
      
      <CommentActions 
        commentId={comment.id}
        initialLikes={comment.likes}
        currentUserId={currentUserId}
      />
    </div>
  );
}
