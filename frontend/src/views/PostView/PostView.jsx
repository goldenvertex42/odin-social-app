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
      // Hits your explicit single post query path
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

  if (loading) return <div className={styles.centeredState} data-testid="post-view-loading">Loading post thread...</div>;
  if (error) {
    return (
      <div className={styles.errorContainer} data-testid="post-view-error">
        <p className={styles.errorText}>{error}</p>
        <Link to="/feed" className={styles.backLink}>← Return to Feed</Link>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer} data-testid="post-view-canvas">
      <div className={styles.pageHeader}>
        <Link to="/feed" className={styles.backLink}>
          <span className={styles.backIcon}>←</span> Back to Home Feed
        </Link>
      </div>

      <div className={styles.mainContent}>
        {post && (
          <PostCard 
            post={post} 
            currentUserId={currentUser?.id} 
          />
        )}
      </div>
    </div>
  );
}
