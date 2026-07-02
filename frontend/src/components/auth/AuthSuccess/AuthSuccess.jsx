import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './AuthSuccess.module.css';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      
      refreshUser().then(() => {
        navigate('/feed', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, refreshUser, navigate]);

  return (
    <main className={styles.container} aria-busy="true">
      <div className={styles.spinner} role="presentation"></div>
      
      <h1 
        className={styles.title} 
        role="status" 
        aria-live="polite"
      >
        Securing your workspace profile...
      </h1>
    </main>
  );
}
