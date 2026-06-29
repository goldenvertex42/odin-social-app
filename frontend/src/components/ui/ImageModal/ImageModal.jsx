import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './ImageModal.module.css';

export default function ImageModal({ imageUrl, altText = "Enlarged media preview", onClose }) {
  useEffect(() => {
    if (!imageUrl) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div 
      className={styles.overlay} 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-label="Image preview modal" 
      data-testid="modal-backdrop"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button 
          className={styles.closeButton} 
          onClick={onClose} 
          aria-label="Close image viewer"
          data-testid="close-modal-btn"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <img 
          src={imageUrl} 
          alt={altText} 
          className={styles.modalImage} 
          referrerPolicy="no-referrer" 
        />
      </div>
    </div>,
    document.body
  );
}
