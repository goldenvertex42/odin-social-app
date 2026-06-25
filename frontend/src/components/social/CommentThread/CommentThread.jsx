import { useState } from 'react';
import Comment from '../Comment/Comment';
import NewCommentForm from '../NewCommentForm/NewCommentForm';
import styles from './CommentThread.module.css';

export default function CommentThread({ comments: initialComments, postId, currentUserId }) {
  // Defensive check: force array, then explicitly sort descending by date text strings
  const [comments, setComments] = useState(() => {
    const rawComments = Array.isArray(initialComments) ? initialComments : [];
    return [...rawComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCommentCreated = (newComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  const hasHiddenComments = comments.length > 1;
  const hiddenCount = comments.length - 1;
  const visibleComments = isExpanded ? comments : comments.slice(0, 1);

  return (
    <div className={styles.threadWrapper} data-testid="comment-thread">
      <NewCommentForm postId={postId} onCommentCreated={handleCommentCreated} />

      {comments.length === 0 ? (
        // FIXED: Added the required fallback structural anchor label to satisfy the empty unit test case
        <p className={styles.emptyMessage} data-testid="empty-comments-msg">No comments yet.</p>
      ) : (
        <div className={styles.commentList} data-testid="visible-comments">
          {visibleComments.map((comment) => (
            <Comment key={comment.id} comment={comment} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {hasHiddenComments && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className={styles.threadToggleAction} 
          data-testid="thread-toggle-btn"
        >
          {isExpanded ? 'View Less' : `View More (${hiddenCount} hidden)`}
        </button>
      )}
    </div>
  );
}
