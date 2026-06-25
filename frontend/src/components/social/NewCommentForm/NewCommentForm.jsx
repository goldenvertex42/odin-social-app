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
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className={styles.commentInput}
        maxLength={140}
        required
        disabled={isSubmitting}
        data-testid="comment-input"
      />
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting || !content.trim()}
        data-testid="comment-submit"
      >
        {isSubmitting ? 'Posting...' : 'Reply'}
      </button>
    </form>
  );
}
