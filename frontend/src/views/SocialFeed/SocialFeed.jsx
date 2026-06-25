import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import NewPostForm from '../../components/social/NewPostForm/NewPostForm';
import PostCard from '../../components/social/PostCard/PostCard';
import styles from './SocialFeed.module.css';

export default function SocialFeed() {
  const { user: currentUser } = useAuth(); // Access global active user state
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
      const response = await fetch('/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
    // Hydrate the raw database response with nested author details to satisfy PostCard expectations
    const fullyHydratedPost = {
      ...apiPostResponse,
      createdAt: apiPostResponse.createdAt || new Date().toISOString(),
      author: {
        id: currentUser?.id,
        username: currentUser?.username || 'You',
        avatarUrl: currentUser?.avatarUrl,
        email: currentUser?.email || ''
      },
      comments: [],
      likes: []
    };

    // Prepend safely to the descending feed array
    setPosts((prevPosts) => [fullyHydratedPost, ...prevPosts]);
  };

  if (loading) return <div className={styles.loading} data-testid="feed-loading">Loading your feed...</div>;
  if (error) return <div className={styles.error} data-testid="feed-error">{error}</div>;

  return (
    <div className={styles.feedContainer}>
      <NewPostForm onPostCreated={handlePostCreated} />

      <main className={styles.feedList} data-testid="feed-list">
        {posts.length === 0 ? (
          <p className={styles.emptyMessage} data-testid="empty-message">
            No posts to display. Follow others to populate your feed!
          </p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
          ))
        )}
      </main>
    </div>
  );
}
