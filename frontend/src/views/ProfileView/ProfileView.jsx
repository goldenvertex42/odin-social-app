import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useTheme } from '../../context/ThemeContext/ThemeContext'; // Import your custom theme hook
import { customFetch } from '../../utils/api/api';
import PostCard from '../../components/social/PostCard/PostCard';
import styles from './ProfileView.module.css';

import { Settings, UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';

export default function ProfileView() {
  const { id: profileId } = useParams();
  const { user: currentUser } = useAuth();
  const { setProfileOverridePalette } = useTheme(); // Extract the override setter
  
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [relationship, setRelationship] = useState('NOT_FOLLOWING');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const isSelf = currentUser?.id === profileId;

  useEffect(() => {
    fetchProfileAndPosts();
  }, [profileId]);

  // OVERRIDE EFFECT: Use your explicit ThemeContext setter to intercept color tokens smoothly
  useEffect(() => {
    if (!profileData || !profileData.colorPalette) return;

    // Set the override to the target profile's preferred palette color string
    setProfileOverridePalette(profileData.colorPalette);

    // CLEANUP TRIGGER: Reset to null on unmount or profile swap to restore the session user's style instantly
    return () => {
      setProfileOverridePalette(null);
    };
  }, [profileData, setProfileOverridePalette]);

  const fetchProfileAndPosts = async () => {
    try {
      setLoading(true);
      
      const userRes = await customFetch(`/api/users/${profileId}`);
      if (!userRes.ok) throw new Error('Could not resolve profile information.');
      const userData = await userRes.json();
      
      setProfileData(userData);
      setRelationship(userData.relationshipStatus || 'NOT_FOLLOWING');

      const postsRes = await customFetch(`/api/posts/user/${profileId}`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const cleanPostsArray = Array.isArray(postsData) 
          ? postsData 
          : (postsData.posts && Array.isArray(postsData.posts) ? postsData.posts : []);
          
        setPosts(cleanPostsArray);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkAction = async (method, endpoint, nextStatus) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const response = await customFetch(endpoint, { method });
      if (!response.ok) throw new Error('Transaction rejected.');
      setRelationship(nextStatus);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConnectionButton = () => {
    if (isSelf) {
      return (
        <Link 
          to="/settings" 
          className={`${styles.actionBtn} ${styles.editProfileBtn}`}
          data-testid="edit-profile-navigation-btn"
        >
          <Settings className={styles.btnIcon} aria-hidden="true" size={16} />
          <span className={styles.btnText}>Edit Profile</span>
        </Link>
      );
    }

    switch (relationship) {
      case 'NOT_FOLLOWING':
        return (
          <button
            onClick={() => handleNetworkAction('POST', `/api/users/${profileId}/follow`, 'REQUEST_SENT')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.connectBtn}`}
            data-testid="profile-connect-btn"
          >
            <UserPlus className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Connecting...' : 'Connect'}</span>
          </button>
        );
      case 'REQUEST_SENT':
        return (
          <button
            onClick={() => handleNetworkAction('DELETE', `/api/users/${profileId}/cancel`, 'NOT_FOLLOWING')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.cancelBtn}`}
            data-testid="profile-cancel-btn"
          >
            <UserX className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Canceling...' : 'Cancel Request'}</span>
          </button>
        );
      case 'REQUEST_RECEIVED':
        return (
          <div className={styles.btnGroup}>
            <button
              onClick={() => handleNetworkAction('PATCH', `/api/users/${profileId}/accept`, 'FOLLOWING')}
              disabled={isProcessing}
              className={`${styles.actionBtn} ${styles.acceptBtn}`}
              data-testid="profile-accept-btn"
            >
              <UserCheck className={styles.btnIcon} aria-hidden="true" size={16} />
              <span className={styles.btnText}>Accept</span>
            </button>
            <button
              onClick={() => handleNetworkAction('DELETE', `/api/users/${profileId}/cancel`, 'NOT_FOLLOWING')}
              disabled={isProcessing}
              className={`${styles.actionBtn} ${styles.rejectBtn}`}
            >
              Ignore
            </button>
          </div>
        );
      case 'FOLLOWING':
        return (
          <button
            onClick={() => handleNetworkAction('DELETE', `/api/users/${profileId}/cancel`, 'NOT_FOLLOWING')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.disconnectBtn}`}
            data-testid="profile-unfollow-btn"
          >
            <UserMinus className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Disconnecting...' : 'Disconnect'}</span>
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className={styles.centeredState}>Loading member timeline...</div>;
  if (error) return <div className={`${styles.centeredState} ${styles.error}`}>{error}</div>;

  return (
    <div className={styles.profileContainer} data-testid="profile-view-canvas">
      <header className={styles.profileHeader} data-testid="profile-header">
        <img 
          src={profileData?.avatarUrl} 
          alt="" 
          className={styles.avatarBig} 
        />
        <div className={styles.headerDetails}>
          <h1 className={styles.displayName}>{profileData?.displayName || profileData?.username}</h1>
          <p className={styles.username}>@{profileData?.username}</p>
          {profileData?.bio && <p className={styles.bioText}>{profileData.bio}</p>}
        </div>
        <div className={styles.headerActions}>
          {renderConnectionButton()}
        </div>
      </header>

      <main className={styles.timelineSection}>
        <h2 className={styles.timelineHeading}>Recent Activity</h2>
        {posts.length === 0 ? (
          <p className={styles.emptyTimeline}>No posts published yet by this user.</p>
        ) : (
          <div className={styles.postStack}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
