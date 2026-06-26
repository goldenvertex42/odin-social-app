import { Link } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './Header.module.css';

import { Globe } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.headerContainer}>
      <div className={styles.brandingBlock}>
        <Link to="/feed" className={styles.logoLink}>
          <Globe className={styles.logoIcon} aria-hidden="true" size={24} />
          <span className={styles.logoText}>SocialSphere</span>
        </Link>
      </div>
      
      <div className={styles.sessionControl}>
        {user ? (
          <div className={styles.authenticatedUser}>
            <div className={styles.profileBadge}>
              <img 
                src={user.avatarUrl} 
                alt={`${user.displayName || user.username}'s profile`} 
                className={styles.userAvatar} 
              />
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
