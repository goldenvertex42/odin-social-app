import { useState, useEffect } from 'react';
import FollowCard from '../../components/network/FollowCard/FollowCard';
import styles from './UserIndex.module.css';

export default function UserIndex() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
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

  // UPPER PANEL FILTERS: Segregate incoming vs outgoing engagement states
  const incomingRequests = profiles.filter((p) => p.followStatus === 'REQUEST_RECEIVED');
  const sentRequests = profiles.filter((p) => p.followStatus === 'REQUEST_SENT');

  // LOWER PANEL FILTER: Pure Exploration Mode (Exclude active connections and pending interactions)
  const standardDirectory = profiles.filter(
    (p) => p.followStatus !== 'REQUEST_RECEIVED' && 
           p.followStatus !== 'FOLLOWING' && 
           p.followStatus !== 'REQUEST_SENT'
  );

  const hasPendingActivity = incomingRequests.length > 0 || sentRequests.length > 0;

  if (loading) return <div className={styles.centeredState} data-testid="directory-loading">Syncing membership records...</div>;
  if (error) return <div className={`${styles.centeredState} ${styles.error}`} data-testid="directory-error">{error}</div>;

  return (
    <div className={styles.pageContainer}>
      
      {/* UNIFIED UPPER PANEL: Active Pending Network Tray */}
      {hasPendingActivity && (
        <section className={styles.traySection} data-testid="pending-tray" aria-label="Pending connections dashboard">
          <h2 className={styles.sectionHeading}>Pending Connections</h2>
          <div className={styles.trayLayoutSubgrid}>
            
            {/* SUB-SECTION A: Incoming Actions */}
            {incomingRequests.length > 0 && (
              <div className={styles.subTray} data-testid="incoming-subtray">
                <h3 className={styles.subHeading}>Received Requests ({incomingRequests.length})</h3>
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

            {/* SUB-SECTION B: Outbound Actions */}
            {sentRequests.length > 0 && (
              <div className={styles.subTray} data-testid="sent-subtray">
                <h3 className={styles.subHeading}>Sent Requests ({sentRequests.length})</h3>
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

      {/* LOWER PANEL: Global Discovery Feed */}
      <section className={styles.directorySection} data-testid="global-directory" aria-label="Global community directory">
        <h2 className={styles.sectionHeading}>Explore Community Members</h2>
        {standardDirectory.length === 0 ? (
          <p className={styles.emptyMessage} data-testid="empty-directory-msg">No new profiles found in the system registry.</p>
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
