import { useState } from 'react';
import styles from './PostCard.module.css';

export default function PostMedia({ imageUrl }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) return null;

  return (
    <div className={styles.imageWrapper}>
      <img 
        src={imageUrl} 
        alt="User published media asset" 
        className={styles.mediaAsset} 
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)} 
      />
    </div>
  );
}
