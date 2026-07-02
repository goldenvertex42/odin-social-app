import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import Comment from '../Comment/Comment';
import NewCommentForm from '../NewCommentForm/NewCommentForm';
import styles from './CommentThread.module.css';

export default function CommentThread({ comments = [], postId, currentUserId, postOwnerId, onCommentCreated, onCommentDeleted }) {
  const location = useLocation();

  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const shouldRenderCommentForm = location.pathname.startsWith('/posts/');
  const hasHiddenComments = comments.length > 1;
  const hiddenCount = comments.length - 1;

  const [isExpanded, setIsExpanded] = useState(false);
  const visibleComments = isExpanded ? sortedComments : sortedComments.slice(0, 1);

  return (
    <div className={styles.threadContainer} data-testid="comment-thread">
      {shouldRenderCommentForm && (
        <NewCommentForm postId={postId} onCommentCreated={onCommentCreated} />
      )}

      {sortedComments.length === 0 ? (
        <p className={styles.emptyMessage} data-testid="empty-comments-msg">
          No comments yet.
        </p>
      ) : (
        <div className={styles.commentList} data-testid="visible-comments">
          {visibleComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postOwnerId={postOwnerId}
              onDeleteSuccess={onCommentDeleted}
            />
          ))}
        </div>
      )}

      {hasHiddenComments && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.threadToggleAction}
          data-testid="thread-toggle-btn"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'View Less' : `View More (${hiddenCount} hidden)`}
        </button>
      )}
    </div>
  );
}
