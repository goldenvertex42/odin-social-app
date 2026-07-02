import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './ImageModal.module.css';

export default function ImageModal({ imageUrl, altText = "Enlarged media preview", onClose }) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) return;

    closeBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        
        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
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
      <div 
        ref={modalRef}
        className={styles.modalContent} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          ref={closeBtnRef}
          type="button"
          className={styles.closeButton} 
          onClick={onClose} 
          aria-label="Close image viewer" 
          data-testid="close-modal-btn"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <img src={imageUrl} alt={altText} className={styles.modalImage} referrerPolicy="no-referrer" />
      </div>
    </div>,
    document.body
  );
}
