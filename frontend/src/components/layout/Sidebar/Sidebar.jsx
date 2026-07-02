import { NavLink } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './Sidebar.module.css';
import { Home, Compass, User } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <nav className={styles.sidebarContainer} aria-label="Main Application Navigation">
      <ul className={styles.navigationGrid}>
        <li className={styles.gridItem}>
          <NavLink 
            to="/feed" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
          >
            <Home className={styles.navIcon} aria-hidden="true" size={20} />
            <span className={styles.navText}>Social Feed</span>
          </NavLink>
        </li>

        <li className={styles.gridItem}>
          <NavLink 
            to="/explore" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
          >
            <Compass className={styles.navIcon} aria-hidden="true" size={20} />
            <span className={styles.navText}>Discover Users</span>
          </NavLink>
        </li>

        {user?.id && (
          <li className={styles.gridItem}>
            <NavLink 
              to={`/users/${user.id}`} 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
              data-testid="sidebar-profile-link" 
            >
              <User className={styles.navIcon} aria-hidden="true" size={20} />
              <span className={styles.navText}>My Profile</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
