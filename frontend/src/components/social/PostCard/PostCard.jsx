import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import PostHeader from './PostHeader';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import CommentThread from '../CommentThread/CommentThread';
import styles from './PostCard.module.css';

export default function PostCard({ post, currentUserId, onDeleteSuccess, headingLevel = 'h2' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isStandaloneView = location.pathname === `/posts/${post.id}`;
  const postAuthorId = typeof post.authorId === 'object' ? post.authorId?.id : post.authorId;

  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);

  useEffect(() => {
    setComments(Array.isArray(post.comments) ? post.comments : []);
  }, [post.comments]);

  const handleCardNavigation = () => {
    if (!isStandaloneView) {
      navigate(`/posts/${post.id}`);
    }
  };

  const handleCommentDeleted = (deletedCommentId) => {
    setComments((prevComments) => prevComments.filter(c => c.id !== deletedCommentId));
  };

  const handleCommentCreated = (newComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  return (
    <article className={styles.cardContainer} data-testid="post-card">
      {!isStandaloneView && (
        <button 
          type="button" 
          onClick={handleCardNavigation} 
          className={styles.surfaceOverlayBlockClick}
          aria-label={`Open full thread discussion for post by ${post.author?.displayName || 'User'}`}
        />
      )}

      <PostHeader 
        post={post} 
        currentUserId={currentUserId} 
        onDeleteSuccess={onDeleteSuccess} 
        headingLevel={headingLevel} 
      />
      
      <div className={styles.cardBody}>
        <p className={styles.textContent}>{post.content}</p>
        <PostMedia imageUrl={post.imageUrl} />
      </div>

      <PostActions 
        postId={post.id} 
        initialLikes={post.likes} 
        currentUserId={currentUserId} 
        isStandaloneView={isStandaloneView} 
      />

      <section className={styles.commentThreadSection} aria-label="Post replies stream">
        <h3 className={styles.commentStreamTitle} data-testid="post-comment-counter">
          Comments ({comments.length})
        </h3>
        <CommentThread 
          postId={post.id} 
          comments={comments} 
          currentUserId={currentUserId} 
          postOwnerId={postAuthorId}
          onCommentDeleted={handleCommentDeleted}
          onCommentCreated={handleCommentCreated} 
        />
      </section>
    </article>
  );
}
