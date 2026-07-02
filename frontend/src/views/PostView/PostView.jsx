import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';
import PostCard from '../../components/social/PostCard/PostCard';
import styles from './PostView.module.css';

export default function PostView() {
  const { postId } = useParams();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSinglePost();
  }, [postId]);

  const fetchSinglePost = async () => {
    try {
      setLoading(true);
      const response = await customFetch(`/api/posts/${postId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('The requested post could not be found.');
        throw new Error('Failed to retrieve post details.');
      }
      const data = await response.json();
      setPost(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.centeredState} role="status" aria-live="polite" data-testid="post-view-loading">
        Loading post thread...
      </div>
    );
  }

  if (error) {
    return (
      <main className={styles.errorPageMainContainer} data-testid="post-view-error">
        <div className={styles.errorContainer}>
          <p className={styles.errorText} role="alert">{error}</p>
          <Link to="/feed" className={styles.backLink}>← Return to Feed</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageContainer} data-testid="post-view-canvas">
      <h1 className={styles.visuallyHidden}>Post Discussion Thread View</h1>
      
      <div className={styles.pageHeader}>
        <Link to="/feed" className={styles.backLink} aria-label="Go back to Home Feed list">
          <span className={styles.backIcon} aria-hidden="true">←</span> Back to Home Feed
        </Link>
      </div>

      <div className={styles.mainContent}>
        {post && (
          <PostCard post={post} currentUserId={currentUser?.id} />
        )}
      </div>
    </main>
  );
}
