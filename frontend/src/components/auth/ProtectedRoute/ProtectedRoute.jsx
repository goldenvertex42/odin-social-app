import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import Header from '../../layout/Header/Header';
import Sidebar from '../../layout/Sidebar/Sidebar';
import styles from './ProtectedRoute.module.css';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Handle the active network synchronization sync loop
  if (loading) {
    return (
      <div className={styles.loadingWrapper} data-testid="route-loader">
        <div className={styles.spinner}></div>
        <p className={styles.text}>Synchronizing social session graph...</p>
      </div>
    );
  }

  // If unauthenticated, redirect cleanly to login screen layout
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Renders structural wireframe matrix wrapping nested route children perfectly!
  return (
    <div className={styles.appContainer}>
      <div className={styles.headerArea}>
        <Header />
      </div>
      <aside className={styles.sidebarArea}>
        <Sidebar />
      </aside>
      <main className={styles.mainContentArea}>
        <Outlet />
      </main>
    </div>
  );
}
