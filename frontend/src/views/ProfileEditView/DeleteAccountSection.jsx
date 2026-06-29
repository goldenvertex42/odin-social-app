import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './ProfileEditView.module.css';

export default function DeleteAccountSection({ isGuest }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (isGuest) return null;

  const handleDeleteAccount = async () => {
    if (confirmationText !== user?.username || isDeleting) return;
    setIsDeleting(true);
    setError('');

    try {
      const response = await customFetch('/api/users/profile', { method: 'DELETE' });
      
      if (response.ok) {
        logout();
        navigate('/login?message=account_deleted');
      } else {
        throw new Error('Server failed to accept destruction cascade requests.');
      }
    } catch (err) {
      console.error('Account erasure pipeline exception encountered:', err);
      setError('Failed to purge account data nodes. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <section className={styles.dangerZoneSection} data-testid="danger-zone-panel">
      <h2 className={styles.dangerHeading}>Danger Zone</h2>
      <p className={styles.dangerDescription}>
        Permanently delete your profile workspace, authored posts, comment threads, and relational connection links from the platform registry. This action is irreversible.
      </p>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={styles.triggerDeleteBtn}
        data-testid="trigger-delete-modal-btn"
      >
        <Trash2 size={16} aria-hidden="true" />
        <span>Delete Account</span>
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" data-testid="delete-modal">
          <div className={styles.modalContent}>
            <header className={styles.modalHeader}>
              <AlertTriangle className={styles.warningIcon} size={24} aria-hidden="true" />
              <h3 className={styles.modalHeading}>Absolute Action Required</h3>
            </header>

            <div className={styles.modalBody}>
              <p className={styles.modalWarningText}>
                This will permanently delete the identity node linked to <strong>@{user?.username}</strong>. All data will be immediately cleared from our PostgreSQL cluster and cloud binary sub-folders.
              </p>
              
              <label htmlFor="confirmUsername" className={styles.modalLabel}>
                Type your username <strong>{user?.username}</strong> to confirm:
              </label>
              
              <input
                id="confirmUsername"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={user?.username}
                className={styles.modalInputField}
                disabled={isDeleting}
                autoComplete="off"
              />

              {error && <p className={styles.modalErrorMsg}>{error}</p>}
            </div>

            <footer className={styles.modalActionFooter}>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setConfirmationText('');
                  setError('');
                }}
                disabled={isDeleting}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmationText !== user?.username || isDeleting}
                className={styles.modalConfirmDeleteBtn}
                data-testid="confirm-account-purge-btn"
              >
                {isDeleting ? 'Purging Systems...' : 'Permanently Delete'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
