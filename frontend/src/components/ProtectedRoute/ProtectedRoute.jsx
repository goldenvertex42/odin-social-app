import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext/AuthContext';
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

  // Renders nested route children perfectly while preserving params context!
  return <Outlet />;
}
