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
      // Hits your explicit Directory Index endpoint mapping
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
    // Dynamically update the targeted profile node state inside our main layout state array
    setProfiles((prevProfiles) =>
      prevProfiles.map((p) => (p.id === userId ? { ...p, relationshipStatus: newStatus } : p))
    );
  };

  // Filter profiles into their respective workspace trays based on their status machine flags
  const incomingRequests = profiles.filter((p) => p.relationshipStatus === 'REQUEST_RECEIVED');
  const standardDirectory = profiles.filter((p) => p.relationshipStatus !== 'REQUEST_RECEIVED');

  if (loading) return <div className={styles.centeredState} data-testid="directory-loading">Syncing membership records...</div>;
  if (error) return <div className={styles.centeredState} className={styles.error} data-testid="directory-error">{error}</div>;

  return (
    <div className={styles.pageContainer}>
      {/* UPPER TRAY: Dedicated to evaluating and clearing incoming requests */}
      {incomingRequests.length > 0 && (
        <section className={styles.traySection} data-testid="incoming-tray" aria-label="Pending incoming requests tray">
          <h2 className={styles.sectionHeading}>
            🤝 Connection Requests ({incomingRequests.length})
          </h2>
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
        </section>
      )}

      {/* LOWER TRAY: Global Member Dashboard */}
      <section className={styles.directorySection} data-testid="global-directory" aria-label="Global community directory">
        <h2 className={styles.sectionHeading}>Explore Community Members</h2>
        {standardDirectory.length === 0 ? (
          <p className={styles.emptyMessage} data-testid="empty-directory-msg">No profiles found in the system registry.</p>
        ) : (
          <div className={styles.gridArray}>
            {standardDirectory.map((member) => (
              <FollowCard
                key={member.id}
                member={member}
                initialStatus={member.relationshipStatus || 'NOT_FOLLOWING'}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
