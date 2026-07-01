import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { customFetch } from '../../utils/api/api';
import FollowCard from '../../components/network/FollowCard/FollowCard';
import styles from './UserIndex.module.css';

export default function UserIndex() {
  const { user: currentUser } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customFetch('/api/users');
      
      if (!response.ok) throw new Error('Failed to retrieve user directory states.');
      
      const data = await response.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setProfiles((prevProfiles) =>
      prevProfiles.map((p) =>
        p.id === userId ? { ...p, followStatus: newStatus } : p
      )
    );
  };

  const filteredProfiles = profiles.filter((p) => String(p.id) !== String(currentUser?.id));

  const incomingRequests = filteredProfiles.filter((p) => p.followStatus === 'REQUEST_RECEIVED');
  const sentRequests = filteredProfiles.filter((p) => p.followStatus === 'REQUEST_SENT');

  const standardDirectory = filteredProfiles.filter(
    (p) =>
      p.followStatus !== 'REQUEST_RECEIVED' &&
      p.followStatus !== 'FOLLOWING' &&
      p.followStatus !== 'REQUEST_SENT'
  );

  const hasPendingActivity = incomingRequests.length > 0 || sentRequests.length > 0;

  if (loading) return <div className={styles.centeredState} data-testid="directory-loading">Syncing membership records...</div>;
  if (error) return <div className={`${styles.centeredState} ${styles.error}`} data-testid="directory-error">{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.visuallyHidden}>Network Discovery Center</h2>

      {hasPendingActivity && (
        <section className={styles.traySection} data-testid="pending-tray" aria-label="Pending connections dashboard">
          <h3 className={styles.sectionHeading}>Pending Connections</h3>
          <div className={styles.trayLayoutSubgrid}>
            
            {incomingRequests.length > 0 && (
              <div className={styles.subTray} data-testid="incoming-subtray">
                <h4 className={styles.subHeading}>Received Requests ({incomingRequests.length})</h4>
                <div className={styles.gridArray}>
                  {incomingRequests.map((member) => (
                    <FollowCard
                      key={member.id}
                      member={member}
                      initialStatus="REQUEST_RECEIVED"
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className={styles.subTray} data-testid="sent-subtray">
                <h4 className={styles.subHeading}>Sent Requests ({sentRequests.length})</h4>
                <div className={styles.gridArray}>
                  {sentRequests.map((member) => (
                    <FollowCard
                      key={member.id}
                      member={member}
                      initialStatus="REQUEST_SENT"
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className={styles.directorySection} data-testid="global-directory" aria-label="Global community directory">
        <h3 className={styles.sectionHeading}>Explore Community Members</h3>
        {standardDirectory.length === 0 ? (
          <p className={styles.emptyMessage} data-testid="empty-directory-msg">
            No new profiles found in the system registry.
          </p>
        ) : (
          <div className={styles.gridArray}>
            {standardDirectory.map((member) => (
              <FollowCard
                key={member.id}
                member={member}
                initialStatus={member.followStatus || 'NOT_FOLLOWING'}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
