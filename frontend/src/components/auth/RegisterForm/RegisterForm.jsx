import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { customFetch } from '../../../utils/api/api';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
  });
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic API routing fallback string calculations
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const googleOAuthUrl = `${apiBaseUrl}/api/auth/google`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      const res = await customFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      // Save the returned session JWT from our user creation route payload
      localStorage.setItem('token', data.token);
      
      // Cleanly navigate users straight to their initial feed dashboard viewport
      navigate('/feed', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please check field requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Create your account</h1>
        
        {localError && <div className={styles.errorBanner} role="alert">{localError}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email Address</label>
          <input 
            id="email" 
            type="email" 
            name="email" 
            required 
            disabled={loading} 
            value={formData.email} 
            onChange={handleChange} 
            className={styles.input} 
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>Username</label>
          <input 
            id="username" 
            type="text" 
            name="username" 
            required 
            disabled={loading} 
            value={formData.username} 
            onChange={handleChange} 
            className={styles.input} 
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="displayName" className={styles.label}>Display Name (Optional)</label>
          <input 
            id="displayName" 
            type="text" 
            name="displayName" 
            disabled={loading} 
            value={formData.displayName} 
            onChange={handleChange} 
            className={styles.input} 
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input 
            id="password" 
            type="password" 
            name="password" 
            required 
            disabled={loading} 
            value={formData.password} 
            onChange={handleChange} 
            className={styles.input} 
            autoComplete="new-password"
          />
        </div>
        
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div className={styles.divider}>
          <span>or join with</span>
        </div>

        {/* 🚀 GOOGLE THIRD-PARTY OAUTH SIGN UP LINK */}
        <a 
          href={googleOAuthUrl} 
          className={`${styles.oauthBtn} ${loading ? styles.disabledLink : ''}`}
        >
          <svg className={styles.googleIcon} xmlns="http://www.w3.org" viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign In</Link>
        </p>
      </form>
    </main>
  );
}
