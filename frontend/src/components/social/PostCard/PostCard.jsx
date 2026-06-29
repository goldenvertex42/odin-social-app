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

      <section className={styles.commentThreadSection} aria-label="Post replies stream" onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.commentStreamTitle}>
          Comments ({post.comments?.length || 0})
        </h3>
        <CommentThread 
          postId={post.id} 
          comments={post.comments} 
          currentUserId={currentUserId} 
          postOwnerId={postAuthorId}
        />
      </section>
    </article>
  );
}
