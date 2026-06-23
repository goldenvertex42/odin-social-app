import { useState } from 'react';
import Comment from '../Comment/Comment';
import styles from './CommentThread.module.css';

export default function CommentThread({ comments = [], currentUserId }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Sort comments chronologically: Most Recent First (Descending)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 2. Compute dynamic array slices based on the expand toggle state
  const visibleComments = isExpanded ? sortedComments : sortedComments.slice(0, 1);
  
  // Calculate exactly how many comment nodes are currently hidden
  const hiddenCount = sortedComments.length - 1;

  if (comments.length === 0) {
    return <p className={styles.emptyText}>No comments yet. Start the conversation!</p>;
  }

  return (
    <div className={styles.threadContainer} data-testid="comment-thread">
      <div className={styles.commentListGrid}>
        {visibleComments.map(comment => (
          <Comment 
            key={comment.id} 
            comment={comment} 
            currentUserId={currentUserId} 
          />
        ))}
      </div>

      {/* 3. Render toggle action button only if there are extra items to show */}
      {sortedComments.length > 1 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.threadToggleAction}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <span className={styles.btnIcon}>▲</span> View Less
            </>
          ) : (
            <>
              <span className={styles.btnIcon}>▼</span> View More ({hiddenCount} hidden)
            </>
          )}
        </button>
      )}
    </div>
  );
}
