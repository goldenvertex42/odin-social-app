import { Link } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './Header.module.css';
import { Globe } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.headerContainer} aria-label="Global Application Banner">
      <div className={styles.brandingBlock}>
        <Link to="/feed" className={styles.logoLink} aria-label="SocialSphere Home Feed">
          <Globe className={styles.logoIcon} aria-hidden="true" size={24} />
          <h1 className={styles.logoText}>SocialSphere</h1>
        </Link>
      </div>

      <div className={styles.sessionControl}>
        {user ? (
          <div className={styles.authenticatedUser}>
            <div className={styles.profileBadge}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt=""
                  className={styles.userAvatar} 
                  referrerPolicy="no-referrer"
                  data-testid="user-avatar-image" 
                />
              ) : (
                <div className={styles.userAvatarFallback} aria-hidden="true">
                  {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.userNameDisplay}>
                Hello, <strong className={styles.boldName}>{user.displayName || user.username}</strong>
              </span>
            </div>
            
            <button 
              onClick={logout} 
              className={styles.logoutButton} 
              aria-label="Log out of application"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.guestPrompts}>
            <Link to="/login" className={styles.loginLink}>Sign In</Link>
          </div>
        )}
      </div>
    </header>
  );
}
