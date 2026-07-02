import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import CommentActions from './CommentActions';
import styles from './Comment.module.css';

export default function Comment({ comment, currentUserId, postOwnerId, onDeleteSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
  const commentAuthorId = typeof comment.authorId === 'object' ? comment.authorId?.id : comment.authorId;
  const parentPostOwnerId = typeof postOwnerId === 'object' ? postOwnerId?.id : postOwnerId;
  
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
      setIsDeleting(false);
      setIsVerifying(false);
    }
  };

  const formatFriendlyTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className={styles.commentContainer} data-testid="comment-node">
      <div className={styles.commentHeader}>
        <div className={styles.userInfoBlock}>
          {comment.author?.avatarUrl ? (
            <img 
              src={comment.author.avatarUrl} 
              alt=""
              className={styles.commentAvatar} 
              referrerPolicy="no-referrer" 
              data-testid="comment-user-avatar"
            />
          ) : (
            <div className={styles.commentAvatarFallback} aria-hidden="true">
              {(comment.author?.displayName || comment.author?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className={styles.metaBlock}>
            <Link to={`/users/${commentAuthorId}`} className={styles.authorProfileLink}>
              {comment.author?.displayName || comment.author?.username || 'Unknown User'}
            </Link>
            <span className={styles.timestamp}>
              {formatFriendlyTimestamp(comment.createdAt)}
            </span>
          </div>
        </div>

        {canDelete && (
          <div className={styles.deleteGuardrailWrapper}>
            {!isVerifying ? (
              <button 
                type="button" 
                onClick={() => setIsVerifying(true)} 
                disabled={isDeleting} 
                className={styles.deleteButton} 
                aria-label="Trigger comment deletion pipeline" 
                data-testid="delete-comment-btn"
              >
                <Trash2 className={styles.trashIcon} size={14} aria-hidden="true" />
              </button>
            ) : (
              <div className={styles.inlineVerifyGroup} role="group" aria-label="Confirm comment deletion">
                <span className={styles.verifyPrompt}>Delete?</span>
                <button 
                  type="button" 
                  className={styles.inlineConfirmBtn} 
                  onClick={handleDeleteComment} 
                  disabled={isDeleting}
                >
                  {isDeleting ? '...' : 'Yes'}
                </button>
                <button 
                  type="button" 
                  className={styles.inlineCancelBtn} 
                  onClick={() => setIsVerifying(false)} 
                  disabled={isDeleting}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.commentBody}>
        <p className={styles.contentParagraph}>{comment.content}</p>
      </div>

      <CommentActions commentId={comment.id} initialLikes={comment.likes} currentUserId={currentUserId} />
    </div>
  );
}
