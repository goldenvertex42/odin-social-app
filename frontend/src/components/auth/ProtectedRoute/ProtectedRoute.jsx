import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import Header from '../../layout/Header/Header';
import Sidebar from '../../layout/Sidebar/Sidebar';
import styles from './ProtectedRoute.module.css';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingWrapper} data-testid="route-loader" aria-busy="true">
        <div className={styles.spinner} role="presentation"></div>
        <p className={styles.text} role="status" aria-live="polite">
          Synchronizing social session graph...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.headerArea}>
        <Header />
      </div>
      
      <div className={styles.mainContentArea}>
        <Outlet />
      </div>
      
      <aside className={styles.sidebarArea} aria-label="Application Navigation Rail">
        <Sidebar />
      </aside>
    </div>
  );
}
