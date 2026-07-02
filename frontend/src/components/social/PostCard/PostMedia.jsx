import { useState } from 'react';
import ImageModal from '../../ui/ImageModal/ImageModal';
import styles from './PostCard.module.css';

export default function PostMedia({ imageUrl }) {
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl || hasError) return null;

  return (
    <>
      <button 
        type="button"
        className={styles.imageWrapper} 
        onClick={() => setIsOpen(true)}
        aria-label="Expand image details view overlay panel"
        data-testid="post-media-trigger-button"
      >
        <img 
          src={imageUrl} 
          alt=""
          className={styles.mediaAsset} 
          referrerPolicy="no-referrer" 
          onError={() => setHasError(true)} 
        />
      </button>
      
      {isOpen && (
        <ImageModal imageUrl={imageUrl} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
