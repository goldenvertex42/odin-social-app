import { useEffect } from 'react';
import { Link } from 'react-router';
import { useRelationship } from '../../../hooks/useRelationship/useRelationship';
import styles from './FollowCard.module.css';
import { UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';

export default function FollowCard({ member, initialStatus, onStatusChange }) {
  const defaultStatus = initialStatus || member.followStatus || 'NOT_FOLLOWING';
  const { relationship, setRelationship, isProcessing, executeRelationshipAction } = useRelationship(member.id, defaultStatus);

  useEffect(() => {
    setRelationship(defaultStatus);
  }, [initialStatus, member.followStatus, setRelationship, defaultStatus]);

  const handleAction = async (method, nextStatus) => {
    const success = await executeRelationshipAction(method, nextStatus);
    if (success && onStatusChange) {
      onStatusChange(member.id, nextStatus);
    }
  };

  const renderActionControl = () => {
    switch (relationship) {
      case 'NOT_FOLLOWING':
        return (
          <button 
            type="button"
            onClick={() => handleAction('POST', 'REQUEST_SENT')} 
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
            type="button"
            onClick={() => handleAction('DELETE', 'NOT_FOLLOWING')} 
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
          <div className={styles.btnGroup} role="group" aria-label="Respond to connection request">
            <button 
              type="button"
              onClick={() => handleAction('PATCH', 'FOLLOWING')} 
              disabled={isProcessing} 
              className={`${styles.actionBtn} ${styles.acceptBtn}`} 
              data-testid="accept-btn"
            >
              <UserCheck className={styles.btnIcon} aria-hidden="true" size={16} />
              <span className={styles.btnText}>Accept</span>
            </button>
            <button 
              type="button"
              onClick={() => handleAction('DELETE', 'NOT_FOLLOWING')} 
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
            type="button"
            onClick={() => handleAction('DELETE', 'NOT_FOLLOWING')} 
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
      <Link 
        to={`/users/${member.id}`} 
        className={styles.profileLinkBlock} 
        aria-label={`View ${member.displayName || member.username}'s profile configuration`}
      >
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {(member.displayName || member.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.info}>
          <h4 className={styles.displayName}>
            {member.displayName || member.username}
          </h4>
          <p className={styles.username}>@{member.username}</p>
          {member.bio && <p className={styles.bio}>{member.bio}</p>}
        </div>
      </Link>
      <div className={styles.actions}>
        {renderActionControl()}
      </div>
    </div>
  );
}
