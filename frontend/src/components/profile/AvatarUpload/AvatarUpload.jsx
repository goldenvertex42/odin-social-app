import { useState, useRef } from 'react';
import styles from './AvatarUpload.module.css';

export default function AvatarUploadField({ initialAvatar, onFileSelected }) {
  const [preview, setPreview] = useState(initialAvatar);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onFileSelected(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.heading}>Profile Picture</h2>
      <div className={styles.flexWrapper}>
        <img src={preview} alt="Avatar preview" className={styles.avatarImage} referrerPolicy="no-referrer" />
        <div className={styles.controls}>
          <label className={styles.uploadLabel}>
            Change Picture
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept="image/*" 
              className={styles.hiddenInput}
              data-testid="edit-avatar-input"
            />
          </label>
          <p className={styles.hint}>JPG or PNG. Max size 5MB.</p>
        </div>
      </div>
    </section>
  );
}
