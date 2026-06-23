import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './AuthSuccess.module.css';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Extract the secure JWT string passed from the Express redirect
    const token = searchParams.get('token');

    if (token) {
      // 2. Commit it to LocalStorage so customFetch can read it downstream
      localStorage.setItem('token', token);
      
      // 3. Force AuthContext to immediately pull the profile properties
      refreshUser().then(() => {
        navigate('/feed', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, refreshUser, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <h2 className={styles.title}>Securing your workspace profile...</h2>
    </div>
  );
}
