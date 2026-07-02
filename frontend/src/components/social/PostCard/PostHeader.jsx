import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { Trash2, AlertTriangle } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './PostCard.module.css';

export default function PostHeader({ post, currentUserId, onDeleteSuccess, headingLevel = 'h2' }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const triggerBtnRef = useRef(null);

  const targetCurrentUserId = typeof currentUserId === 'object' ? currentUserId?.id : currentUserId;
  const postAuthorId = typeof post.authorId === 'object' ? post.authorId?.id : post.authorId;
  const isAuthor = String(targetCurrentUserId) === String(postAuthorId);
  const wasModalOpenRef = useRef(false);

  useEffect(() => {
    if (isModalOpen) {
      cancelBtnRef.current?.focus();
      document.body.style.overflow = 'hidden';
      wasModalOpenRef.current = true;
    } else {
      document.body.style.overflow = '';
      if (wasModalOpenRef.current && !isDeleting) {
        triggerBtnRef.current?.focus();
      }
      wasModalOpenRef.current = false;
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, isDeleting]);

  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusables = modalRef.current.querySelectorAll('button');
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

  const closeModal = () => {
    if (isDeleting) return;
    setIsModalOpen(false);
    setError('');
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      const response = await customFetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (response.ok) {
        if (onDeleteSuccess) onDeleteSuccess(post.id);
        setIsModalOpen(false);
      } else {
        throw new Error('Database tier rejected structural drop request.');
      }
    } catch (err) {
      console.error('System failed to execute post removal sequence:', err);
      setError('Failed to delete post. Please try again.');
      setIsDeleting(false);
    }
  };

  const formatFriendlyTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const Heading = headingLevel;

  return (
    <div className={styles.cardHeader}>
      <Link 
        to={`/users/${postAuthorId}`} 
        className={styles.authorProfileBlockLink} 
        aria-label={`View ${post.author?.displayName || post.author?.username || 'User'}'s profile`}
      >
        {post.author?.avatarUrl ? (
          <img 
            src={post.author.avatarUrl} 
            alt="" 
            className={styles.authorAvatar} 
            referrerPolicy="no-referrer" 
            data-testid="post-header-avatar"
          />
        ) : (
          <div className={styles.authorAvatarFallback} aria-hidden="true" data-testid="header-avatar-fallback">
            {(post.author?.displayName || post.author?.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.metaText}>
          <Heading className={styles.authorProfileNameText}>
            {post.author?.displayName || post.author?.username || 'Unknown User'}
          </Heading>
          <time className={styles.postTimestamp} dateTime={post.createdAt}>
            {formatFriendlyTimestamp(post.createdAt)}
          </time>
        </div>
      </Link>

      {isAuthor && (
        <button 
          ref={triggerBtnRef} 
          type="button" 
          onClick={() => setIsModalOpen(true)} 
          disabled={isDeleting} 
          className={styles.deleteButton} 
          aria-label="Open post deletion dialogue" 
          data-testid="delete-post-btn"
        >
          <Trash2 className={styles.trashIcon} size={16} aria-hidden="true" />
        </button>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal} data-testid="delete-post-modal-overlay">
          <div 
            ref={modalRef} 
            className={styles.modalContent} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="delete-post-dialog-title" 
            aria-describedby="delete-post-dialog-desc" 
            onKeyDown={handleModalKeyDown} 
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <AlertTriangle className={styles.warningIcon} size={22} aria-hidden="true" />
              <h3 id="delete-post-dialog-title" className={styles.modalHeading}>Delete Post?</h3>
            </header>
            <div className={styles.modalBody}>
              <p id="delete-post-dialog-desc" className={styles.modalWarningText}>
                Are you sure you want to permanently erase this post entry? This will immediately clear attached media data bundles and drop all relational nested comment strings within your database ecosystem.
              </p>
              {error && <p className={styles.modalErrorMsg} role="alert">{error}</p>}
            </div>
            <footer className={styles.modalActionFooter}>
              <button ref={cancelBtnRef} type="button" onClick={closeModal} disabled={isDeleting} className={styles.modalCancelBtn}>
                Cancel
              </button>
              <button type="button" onClick={handleDeletePost} disabled={isDeleting} className={styles.modalConfirmDeleteBtn} data-testid="confirm-post-purge-btn">
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
