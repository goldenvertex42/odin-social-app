import { useState, useRef, useEffect } from 'react';
import styles from './AvatarUpload.module.css';
import heic2any from 'heic2any';

export default function AvatarUploadField({ initialAvatar, onFileSelected }) {
  const [preview, setPreview] = useState(initialAvatar);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = async (e) => {
    const fileListCollection = e.target.files;
    if (!fileListCollection || fileListCollection.length === 0) return;

    let singleFileBlob = fileListCollection.item(0);
    if (!singleFileBlob) return;

    const isHeic = 
      singleFileBlob.type === 'image/heic' || 
      singleFileBlob.type === 'image/heif' ||
      singleFileBlob.name.toLowerCase().endsWith('.heic') ||
      singleFileBlob.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        setIsConverting(true);
        
        const convertedBlob = await heic2any({
          blob: singleFileBlob,
          toType: 'image/jpeg',
          quality: 0.8
        });

        const newFileName = singleFileBlob.name.replace(/\.(heic|heif)$/i, '.jpg');
        singleFileBlob = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
        
      } catch (err) {
        console.error('Avatar HEIC processing pipeline failure:', err);
        alert('Failed to process Apple HEIC avatar format. Please use standard JPEG or PNG.');
        setIsConverting(false);
        return;
      } finally {
        setIsConverting(false);
      }
    }

    onFileSelected(singleFileBlob);

    const originObjectURL = URL.createObjectURL(singleFileBlob);
    setPreview(originObjectURL);
  };

  return (
    <section className={styles.sectionContainer} aria-labelledby="avatar-upload-heading">
      <h2 id="avatar-upload-heading" className={styles.heading}>Profile Picture</h2>
      
      <div className={styles.flexWrapper}>
        <div className={styles.avatarImgBoundary}>
          <img 
            src={preview} 
            alt="Avatar preview" 
            className={styles.avatarImage} 
            referrerPolicy="no-referrer" 
          />
          {isConverting && (
            <div className={styles.loadingSpinnerMask} role="status" aria-live="polite">
              <span className={styles.visuallyHidden}>Converting Apple HEIC photo...</span>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <label 
            htmlFor="avatar-file-upload-node" 
            className={`${styles.uploadLabel} ${isConverting ? styles.disabledLabel : ''}`}
          >
            {isConverting ? 'Processing HEIC...' : 'Change Picture'}
          </label>
          
          <input 
            type="file" 
            id="avatar-file-upload-node" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,.heic,.heif" 
            className={styles.hiddenInput} 
            disabled={isConverting}
            data-testid="edit-avatar-input" 
            aria-label="Upload a new profile avatar image" 
          />
          
          <p className={styles.hint} id="avatar-format-hint">
            JPG, PNG, or native HEIC camera uploads. Max 5MB.
          </p>
        </div>
      </div>
    </section>
  );
}
