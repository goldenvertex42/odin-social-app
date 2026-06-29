import { useState } from 'react';
import ProfileActions from './ProfileActions';
import ImageModal from '../../components/ui/ImageModal/ImageModal';
import styles from './ProfileView.module.css';

export default function ProfileHeader({ profileData, isSelf, relationship, isProcessing, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={styles.profileHeader} data-testid="profile-header">
      <div className={styles.imageWrapper} onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}>
        <img
          src={profileData?.avatarUrl}
          alt=""
          className={styles.avatarBig}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className={styles.headerDetails}>
        <h2 className={styles.displayName}>
          {profileData?.displayName || profileData?.username}
        </h2>
        <p className={styles.username}>@{profileData?.username}</p>
        {profileData?.bio && <p className={styles.bioText}>{profileData.bio}</p>}
      </div>
      <div className={styles.headerActions}>
        <ProfileActions 
          isSelf={isSelf} 
          relationship={relationship} 
          isProcessing={isProcessing} 
          onAction={onAction} 
        />
      </div>

      {isOpen && (
        <ImageModal 
          imageUrl={profileData?.avatarUrl}
          altText={`${profileData?.displayName || profileData?.username}'s enlarged avatar preview`} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
