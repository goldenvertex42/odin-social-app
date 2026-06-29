import { useState } from 'react';
import { customFetch } from '../../../utils/api/api';
import styles from './NewCommentForm.module.css';

export default function NewCommentForm({ postId, onCommentCreated }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      // Constructing dynamic absolute path targeting your backend architecture
      const response = await customFetch(`/api/comments/post/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) throw new Error('Failed to publish comment.');
      
      const data = await response.json();
      const cleanCommentNode = data.comment ? data.comment : data;
      onCommentCreated(cleanCommentNode);
      setContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} data-testid="new-comment-form">
      <label htmlFor={`comment-input-${postId}`} className={styles.visuallyHidden}>
        Write a response to this post
      </label>

      <textarea
        id={`comment-input-${postId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className={styles.commentInput}
        data-testid="new-comment-input"
        required
      />

      <button 
        type="submit" 
        disabled={isSubmitting || !content.trim()} 
        className={styles.submitBtn}
        data-testid="comment-submit-btn"
      >
        {isSubmitting ? 'Replying...' : 'Reply'}
      </button>
    </form>
  );
}
