import { NavLink } from 'react-router';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <nav className={styles.sidebarContainer} aria-label="Main Application Navigation">
      <ul className={styles.navigationGrid}>
        <li className={styles.gridItem}>
          <NavLink 
            to="/feed" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
          >
            <span className={styles.navIcon} aria-hidden="true">🏠</span>
            <span className={styles.navText}>Social Feed</span>
          </NavLink>
        </li>
        <li className={styles.gridItem}>
          <NavLink 
            to="/explore" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
          >
            <span className={styles.navIcon} aria-hidden="true">👥</span>
            <span className={styles.navText}>Discover Users</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
