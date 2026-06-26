import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import styles from './LoginForm.module.css';

import { Zap } from 'lucide-react';

export default function LoginForm() {
  const { login, loginGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = authLoading || localLoading;

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const googleOAuthUrl = `${apiBaseUrl}/api/auth/google`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLocalLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/feed');
    } catch (err) {
      setLocalError(err.message || 'Invalid email or password configuration.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGuestBypass = async () => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      await loginGuest();
      navigate('/feed');
    } catch (err) {
      setLocalError('Failed to initialize transient recruiter workspace.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Sign in to your account</h2>
        
        {localError && <div className={styles.errorBanner} role="alert">{localError}</div>}

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email Address</label>
          <input id="email" type="email" name="email" required disabled={loading} value={formData.email} onChange={handleChange} className={styles.input} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input id="password" type="password" name="password" required disabled={loading} value={formData.password} onChange={handleChange} className={styles.input} autoComplete="current-password" />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <a href={googleOAuthUrl} className={`${styles.oauthBtn} ${loading ? styles.disabledLink : ''}`}>
          <svg className={styles.googleIcon} xmlns="http://w3.org" viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>

        <button type="button" disabled={loading} onClick={handleGuestBypass} className={styles.guestBtn}>
          <Zap className={styles.zapIcon} size={16} aria-hidden="true" fill="currentColor" />
          <span>Instant Recruiter Guest Access</span>
        </button>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/register" className={styles.link}>Sign Up</Link>
        </p>
      </form>
    </div>
  );
}
