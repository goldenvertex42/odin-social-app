import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import Comment from '../Comment/Comment';
import NewCommentForm from '../NewCommentForm/NewCommentForm';
import styles from './CommentThread.module.css';

export default function CommentThread({ comments: initialComments, postId, currentUserId, postOwnerId }) {
  const location = useLocation();

  const [comments, setComments] = useState(() => {
    const rawComments = Array.isArray(initialComments) ? initialComments : [];
    return [...rawComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const rawComments = Array.isArray(initialComments) ? initialComments : [];
    setComments([...rawComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [initialComments]);

  const handleCommentCreated = (newComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  const handleCommentDeleted = (deletedCommentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment.id !== deletedCommentId));
  };

  const shouldRenderCommentForm = location.pathname.startsWith('/posts/');
  const hasHiddenComments = comments.length > 1;
  const hiddenCount = comments.length - 1;
  const visibleComments = isExpanded ? comments : comments.slice(0, 1);

  return (
    <div className={styles.threadContainer} data-testid="comment-thread">
      {shouldRenderCommentForm && (
        <NewCommentForm postId={postId} onCommentCreated={handleCommentCreated} />
      )}

      {comments.length === 0 ? (
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
              onDeleteSuccess={handleCommentDeleted}
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
