import styles from './PasswordUpdate.module.css';

export default function PasswordUpdate({ values, onChange }) {
  return (
    <section className={styles.sectionContainer} aria-labelledby="security-section-heading">
      <h2 id="security-section-heading" className={styles.heading}>Security (Change Password)</h2>
      
      <p id="password-optional-hint" className={styles.hint}>
        Leave fields blank if you do not wish to modify your password.
      </p>

      <div className={styles.inputGroup}>
        <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
        <input 
          id="currentPassword" 
          type="password" 
          value={values.currentPassword} 
          onChange={(e) => onChange('currentPassword', e.target.value)} 
          className={styles.input} 
          placeholder="Enter current password"
          required={!!values.newPassword} 
          autoComplete="current-password" 
          aria-describedby="password-optional-hint"
        />
      </div>

      <div className={styles.gridSplitter}>
        <div className={styles.inputGroup}>
          <label htmlFor="newPassword" className={styles.label}>New Password</label>
          <input 
            id="newPassword" 
            type="password" 
            value={values.newPassword} 
            onChange={(e) => onChange('newPassword', e.target.value)} 
            className={styles.input} 
            placeholder="Min 8 characters" 
            minLength={8} 
            autoComplete="new-password" 
            aria-describedby="password-optional-hint"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
          <input 
            id="confirmPassword" 
            type="password" 
            value={values.confirmPassword} 
            onChange={(e) => onChange('confirmPassword', e.target.value)} 
            className={styles.input} 
            placeholder="Confirm new password" 
            required={!!values.newPassword} 
            autoComplete="new-password" 
            aria-describedby="password-optional-hint"
          />
        </div>
      </div>
    </section>
  );
}
