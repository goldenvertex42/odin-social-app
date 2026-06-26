import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { customFetch } from '../../../utils/api/api';
import styles from './FollowCard.module.css';
import { UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';

export default function FollowCard({ member, initialStatus, onStatusChange }) {
  const [status, setStatus] = useState(initialStatus || member.followStatus || 'NOT_FOLLOWING');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    } else if (member.followStatus) {
      setStatus(member.followStatus);
    }
  }, [initialStatus, member.followStatus]);

  const handleNetworkAction = async (method, endpoint, nextStatus) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const response = await customFetch(endpoint, { method });
      if (!response.ok) throw new Error('Network transaction rejected.');
      
      setStatus(nextStatus);
      if (onStatusChange) {
        onStatusChange(member.id, nextStatus);
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionControl = () => {
    switch (status) {
      case 'NOT_FOLLOWING':
        return (
          <button 
            onClick={() => handleNetworkAction('POST', `/api/users/${member.id}/follow`, 'REQUEST_SENT')} 
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.connectBtn}`}
            data-testid="follow-btn"
          >
            <UserPlus className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Connecting...' : 'Connect'}</span>
          </button>
        );
      case 'REQUEST_SENT':
        return (
          <button 
            onClick={() => handleNetworkAction('DELETE', `/api/users/${member.id}/cancel`, 'NOT_FOLLOWING')} 
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.cancelBtn}`}
            data-testid="cancel-request-btn"
          >
            <UserX className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Canceling...' : 'Cancel Request'}</span>
          </button>
        );
      case 'REQUEST_RECEIVED':
        return (
          <div className={styles.btnGroup}>
            <button 
              onClick={() => handleNetworkAction('PATCH', `/api/users/${member.id}/accept`, 'FOLLOWING')} 
              disabled={isProcessing}
              className={`${styles.actionBtn} ${styles.acceptBtn}`}
              data-testid="accept-btn"
            >
              <UserCheck className={styles.btnIcon} aria-hidden="true" size={16} />
              <span className={styles.btnText}>Accept</span>
            </button>
            <button 
              onClick={() => handleNetworkAction('DELETE', `/api/users/${member.id}/cancel`, 'NOT_FOLLOWING')} 
              disabled={isProcessing}
              className={`${styles.actionBtn} ${styles.rejectBtn}`}
              data-testid="reject-btn"
            >
              <UserX className={styles.btnIcon} aria-hidden="true" size={16} />
              <span className={styles.btnText}>Ignore</span>
            </button>
          </div>
        );
      case 'FOLLOWING':
        return (
          <button 
            onClick={() => handleNetworkAction('DELETE', `/api/users/${member.id}/cancel`, 'NOT_FOLLOWING')} 
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.disconnectBtn}`}
            data-testid="unfollow-btn"
          >
            <UserMinus className={styles.btnIcon} aria-hidden="true" size={16} />
            <span className={styles.btnText}>{isProcessing ? 'Disconnecting...' : 'Disconnect'}</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card} data-testid={`follow-card-${member.id}`}>
      <Link to={`/users/${member.id}`} className={styles.avatarLink}>
        <img 
          src={member.avatarUrl} 
          alt={`${member.displayName || member.username}'s avatar`} 
          className={styles.avatar}
          referrerPolicy="no-referrer" 
        />
      </Link>
      <div className={styles.info}>
        <Link to={`/users/${member.id}`} className={styles.profileLink}>
          <h3 className={styles.displayName}>{member.displayName || member.username}</h3>
        </Link>
        <p className={styles.username}>@{member.username}</p>
        {member.bio && <p className={styles.bio}>{member.bio}</p>}
      </div>
      <div className={styles.actions}>
        {renderActionControl()}
      </div>
    </div>
  );
}
