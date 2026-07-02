import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { customFetch } from '../../utils/api/api';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useTheme } from '../../context/ThemeContext/ThemeContext';

import AvatarUpload from '../../components/profile/AvatarUpload/AvatarUpload';
import ThemePreview from '../../components/profile/ThemePreview/ThemePreview';
import PasswordUpdate from '../../components/profile/PasswordUpdate/PasswordUpdate';
import DeleteAccountSection from './DeleteAccountSection';
import styles from './ProfileEditView.module.css';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { colorScheme, colorPalette, updateTheme } = useTheme();
  
  const initialThemeRef = useRef({ scheme: colorScheme, palette: colorPalette });
  const isSavedRef = useRef(false);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  const [selectedScheme, setSelectedScheme] = useState(colorScheme);
  const [selectedPalette, setSelectedPalette] = useState(colorPalette);

  const [passwordState, setPasswordState] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      if (user.displayName) setDisplayName(user.displayName);
      if (user.bio) setBio(user.bio);
      if (user.colorScheme) setSelectedScheme(user.colorScheme);
      if (user.colorPalette) setSelectedPalette(user.colorPalette);
      initialThemeRef.current = { scheme: user.colorScheme, palette: user.colorPalette };
    }
  }, [user]);

  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    return () => {
      if (!isSavedRef.current) {
        document.documentElement.setAttribute('data-color-scheme', initialThemeRef.current.scheme);
        document.documentElement.setAttribute('data-color-palette', initialThemeRef.current.palette);
      }
    };
  }, []);

  const handlePasswordChange = (field, value) => {
    setPasswordState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    document.documentElement.setAttribute('data-color-scheme', initialThemeRef.current.scheme);
    document.documentElement.setAttribute('data-color-palette', initialThemeRef.current.palette);
    updateTheme(initialThemeRef.current.scheme, initialThemeRef.current.palette);
    navigate(`/users/${user?.id}`);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    
    if (passwordState.newPassword && passwordState.newPassword !== passwordState.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password selections do not match.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('displayName', displayName.trim());
      formData.append('bio', bio.trim());
      formData.append('colorScheme', selectedScheme);
      formData.append('colorPalette', selectedPalette);
      
      if (avatarFile) formData.append('avatar', avatarFile);
      if (passwordState.newPassword) {
        formData.append('currentPassword', passwordState.currentPassword);
        formData.append('newPassword', passwordState.newPassword);
      }

      const response = await customFetch('/api/users/profile', { method: 'PUT', body: formData });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to update account profiles.');
      
      isSavedRef.current = true;
      await updateTheme(selectedScheme, selectedPalette);
      await refreshUser();
      
      initialThemeRef.current = { scheme: selectedScheme, palette: selectedPalette };
      setStatusMessage({ type: 'success', text: 'Changes saved successfully!' });
      
      setTimeout(() => navigate(`/users/${user?.id}`), 1200);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
      document.documentElement.setAttribute('data-color-scheme', initialThemeRef.current.scheme);
      document.documentElement.setAttribute('data-color-palette', initialThemeRef.current.palette);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.editPageContainer} data-testid="profile-edit-canvas">
      <h1 className={styles.pageTitle}>Account Settings</h1>

      {statusMessage.text && (
        <div 
          className={`${styles.statusAlert} ${statusMessage.type === 'error' ? styles.errorAlert : styles.successAlert}`}
          role="alert"
          aria-live="assertive"
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleFormSubmit} noValidate>
        <AvatarUpload initialAvatar={user?.avatarUrl} onFileSelected={setAvatarFile} username={user?.username} />

        <section className={styles.formSection} aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading" className={styles.sectionHeading}>Basic Information</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="displayName" className={styles.fieldLabel}>Display Name</label>
            <input 
              id="displayName" 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              className={styles.textField} 
              required 
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="bio" className={styles.fieldLabel}>Bio</label>
            <textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              className={styles.textareaField} 
              maxLength={160} 
              disabled={isSubmitting}
              rows={4}
            />
          </div>
        </section>

        <ThemePreview 
          scheme={selectedScheme} 
          palette={selectedPalette} 
          onSchemeChange={setSelectedScheme} 
          onPaletteChange={setSelectedPalette} 
        />

        <PasswordUpdate values={passwordState} onChange={handlePasswordChange} />

        <footer className={styles.formActionFooter}>
          <button 
            type="button" 
            onClick={handleCancel} 
            disabled={isSubmitting} 
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={styles.saveBtn} 
            data-testid="save-profile-btn"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </form>

      <DeleteAccountSection isGuest={user?.isGuest} />
    </main>
  );
}
