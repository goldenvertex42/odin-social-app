import { Link } from 'react-router';
import { Settings, UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';
import styles from './ProfileView.module.css';

export default function ProfileActions({ isSelf, relationship, isProcessing, onAction }) {
  if (isSelf) {
    return (
      <Link 
        to="/settings" 
        className={`${styles.actionBtn} ${styles.editProfileBtn}`} 
        data-testid="edit-profile-navigation-btn"
      >
        <Settings className={styles.btnIcon} aria-hidden="true" size={16} />
        <span className={styles.btnText}>Edit Profile</span>
      </Link>
    );
  }

  switch (relationship) {
    case 'NOT_FOLLOWING':
      return (
        <button 
          onClick={() => onAction('POST', 'REQUEST_SENT')} 
          disabled={isProcessing} 
          className={`${styles.actionBtn} ${styles.connectBtn}`} 
          data-testid="profile-connect-btn"
        >
          <UserPlus className={styles.btnIcon} aria-hidden="true" size={16} />
          <span className={styles.btnText}>{isProcessing ? 'Connecting...' : 'Connect'}</span>
        </button>
      );
    case 'REQUEST_SENT':
      return (
        <button 
          onClick={() => onAction('DELETE', 'NOT_FOLLOWING')} 
          disabled={isProcessing} 
          className={`${styles.actionBtn} ${styles.cancelBtn}`} 
          data-testid="profile-cancel-btn"
        >
          <UserX className={styles.btnIcon} aria-hidden="true" size={16} />
          <span className={styles.btnText}>{isProcessing ? 'Canceling...' : 'Cancel Request'}</span>
        </button>
      );
    case 'REQUEST_RECEIVED':
      return (
        <div className={styles.btnGroup}>
          <button 
            onClick={() => onAction('PATCH', 'FOLLOWING')} 
            disabled={isProcessing} 
            className={`${styles.actionBtn} ${styles.acceptBtn}`} 
            data-testid="profile-accept-btn"
          >
            <UserCheck className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>Accept</span>
          </button>
          <button 
            onClick={() => onAction('DELETE', 'NOT_FOLLOWING')} 
            disabled={isProcessing} 
            className={`${styles.actionBtn} ${styles.rejectBtn}`}
          >
            Ignore
          </button>
        </div>
      );
    case 'FOLLOWING':
      return (
        <button 
          onClick={() => onAction('DELETE', 'NOT_FOLLOWING')} 
          disabled={isProcessing} 
          className={`${styles.actionBtn} ${styles.disconnectBtn}`} 
          data-testid="profile-unfollow-btn"
        >
          <UserMinus className={styles.btnIcon} aria-hidden="true" size={16} />
          <span className={styles.btnText}>{isProcessing ? 'Disconnecting...' : 'Disconnect'}</span>
        </button>
      );
    default:
      return null;
  }
}
