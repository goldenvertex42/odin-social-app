import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';
import NewPostForm from '../../components/social/NewPostForm/NewPostForm';
import PostCard from '../../components/social/PostCard/PostCard';
import styles from './SocialFeed.module.css';

export default function SocialFeed() {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await customFetch('/api/posts/feed');
      if (!response.ok) throw new Error('Failed to fetch feed posts.');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (apiPostResponse) => {
    const targetPost = apiPostResponse?.post ? apiPostResponse.post : apiPostResponse;

    if (!targetPost || !targetPost.id) {
      console.error('CRITICAL: handlePostCreated received an invalid post node payload matrix:', apiPostResponse);
      return;
    }

    const unifiedAuthor = targetPost.author || {
      id: currentUser?.id,
      username: currentUser?.username || 'You',
      displayName: currentUser?.displayName || currentUser?.displayName || 'You',
      avatarUrl: currentUser?.avatarUrl || null
    };

    const fullyHydratedPost = {
      ...targetPost,
      createdAt: targetPost.createdAt || new Date().toISOString(),
      author: unifiedAuthor,
      comments: targetPost.comments || [],
      likes: targetPost.likes || []
    };

    setPosts((prevPosts) => [fullyHydratedPost, ...prevPosts]);
  };


  const handlePostDeleted = (deletedPostId) => {
    setPosts((prevPosts) => 
      prevPosts.filter((post) => post.id !== deletedPostId)
    );
  };


  if (loading) return <div className={styles.loading} data-testid="feed-loading">Loading your feed...</div>;
  if (error) return <div className={styles.error} data-testid="feed-error">{error}</div>;

  return (
    <div className={styles.feedContainer}>
      <NewPostForm onPostCreated={handlePostCreated} />

      <div className={styles.feedList} data-testid="feed-list">
        {posts.length === 0 ? (
          <p className={styles.emptyMessage} data-testid="empty-message">
            No posts to display. Follow others to populate your feed!
          </p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} onDeleteSuccess={handlePostDeleted} />
          ))
        )}
      </div>
    </div>
  );
}
