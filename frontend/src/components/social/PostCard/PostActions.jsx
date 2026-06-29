import { useState } from 'react';
import { usePostInteraction } from '../../../hooks/usePostInteraction/usePostInteraction';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { customFetch } from '../../../utils/api/api';
import styles from './PostCard.module.css';

export default function PostActions({ postId, initialLikes, currentUserId, isStandaloneView }) {
  const { likesCount, hasLiked, isLiking, toggleLike } = usePostInteraction(postId, initialLikes, currentUserId)

  return (
    <div className={styles.cardFooter}>
      <button 
        onClick={toggleLike} 
        disabled={isLiking} 
        className={`${styles.likeActionButton} ${hasLiked ? styles.activeLikedState : ''}`} 
        aria-label={hasLiked ? "Unlike post" : "Like post"} 
      >
        <ThumbsUp className={styles.actionIcon} size={16} aria-hidden="true" fill={hasLiked ? "currentColor" : "none"} />
        <span className={styles.actionLabel}>
          {hasLiked ? 'Liked' : 'Like'} ({likesCount})
        </span>
      </button>

      {!isStandaloneView && (
        <button className={styles.threadLinkBtn} aria-label="Open full discussion thread">
          <MessageSquare className={styles.actionIcon} size={16} aria-hidden="true" />
          <span className={styles.actionLabel}>View Full Thread</span>
        </button>
      )}
    </div>
  );
}
