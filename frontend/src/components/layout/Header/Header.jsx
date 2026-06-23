import { Link } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth(); // Clean useAuth integration

  const fallbackAvatar = user?.email 
    ? `https://gravatar.com/avatar/${encodeURIComponent(user.email.trim().toLowerCase())}?d=identicon&s=150`
    : '/default-avatar.svg';

  return (
    <header className={styles.headerContainer}>
      <div className={styles.brandingBlock}>
        <Link to="/feed" className={styles.logoLink}>
          <span className={styles.logoIcon} aria-hidden="true">🚀</span>
          <span className={styles.logoText}>SocialSphere</span>
        </Link>
      </div>

      <div className={styles.sessionControl}>
        {user ? (
          <div className={styles.authenticatedUser}>
            <div className={styles.profileBadge}>
              <img 
                src={user.avatarUrl || fallbackAvatar} 
                alt={`${user.displayName}'s profile`} 
                className={styles.userAvatar} 
              />
              <span className={styles.userNameDisplay}>
                Hello, <strong className={styles.boldName}>{user.displayName}</strong>
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
