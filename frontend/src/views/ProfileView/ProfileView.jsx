import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useTheme } from '../../context/ThemeContext/ThemeContext';
import { useRelationship } from '../../hooks/useRelationship/useRelationship';
import { customFetch } from '../../utils/api/api';
import PostCard from '../../components/social/PostCard/PostCard';
import ProfileHeader from './ProfileHeader';
import styles from './ProfileView.module.css';

export default function ProfileView() {
  const { id: profileId } = useParams();
  const { user: currentUser } = useAuth();
  const { setProfileOverridePalette } = useTheme();
  
  const { relationship, setRelationship, isProcessing, executeRelationshipAction } = useRelationship(profileId, 'NOT_FOLLOWING');
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSelf = currentUser?.id === profileId;

  useEffect(() => {
    fetchProfileAndPosts();
  }, [profileId]);

  useEffect(() => {
    if (!profileData || !profileData.colorPalette) return;
    setProfileOverridePalette(profileData.colorPalette);
    return () => {
      setProfileOverridePalette(null);
    };
  }, [profileData, setProfileOverridePalette]);

  const fetchProfileAndPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const userRes = await customFetch(`/api/users/${profileId}`);
      if (!userRes.ok) throw new Error('Could not resolve profile information.');
      
      const userData = await userRes.json();
      setProfileData(userData);
      setRelationship(userData.relationshipStatus || 'NOT_FOLLOWING');

      const postsRes = await customFetch(`/api/posts/user/${profileId}`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const cleanPostsArray = Array.isArray(postsData) ? postsData : 
                             (postsData.posts && Array.isArray(postsData.posts) ? postsData.posts : []);
        setPosts(cleanPostsArray);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (method, nextStatus) => {
    executeRelationshipAction(method, nextStatus);
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  if (loading) return <div className={styles.centeredState} role="status" aria-live="polite">Loading member timeline...</div>;
  if (error) return <div className={`${styles.centeredState} ${styles.error}`} role="alert">{error}</div>;

  return (
    <main className={styles.profileContainer} data-testid="profile-view-canvas">
      <h1 className={styles.visuallyHidden}>
        {profileData?.displayName || profileData?.username}'s Member Profile Hub
      </h1>

      <ProfileHeader 
        profileData={profileData} 
        isSelf={isSelf} 
        relationship={relationship} 
        isProcessing={isProcessing} 
        onAction={handleAction} 
      />

      <div className={styles.timelineSection}>
        <h2 className={styles.timelineHeading}>Recent Activity</h2>
        {posts.length === 0 ? (
          <p className={styles.emptyTimeline}>No posts published yet by this user.</p>
        ) : (
          <div className={styles.postStack}>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUser?.id} 
                onDeleteSuccess={handlePostDeleted} 
                headingLevel="h3" 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
