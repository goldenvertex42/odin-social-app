import { useState } from 'react';
import ImageModal from '../../ui/ImageModal/ImageModal';
import styles from './PostCard.module.css';

export default function PostMedia({ imageUrl }) {
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl || hasError) return null;

  return (
    <>
      <div className={styles.imageWrapper} onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}>
        <img 
          src={imageUrl} 
          alt="User published media asset" 
          className={styles.mediaAsset} 
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)} 
        />
      </div>

      {isOpen && (
        <ImageModal 
          imageUrl={imageUrl} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
