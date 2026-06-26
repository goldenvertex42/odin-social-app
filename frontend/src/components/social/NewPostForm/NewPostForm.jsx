import { useState, useRef } from 'react';
import { customFetch } from '../../../utils/api/api';
import styles from './NewPostForm.module.css';

import { Image, X } from 'lucide-react';

export default function NewPostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('content', content);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Aligned: Swapped manual fetch loop for your unified customFetch interceptor token layer
      const response = await customFetch('/api/posts', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to publish your post.');
      const data = await response.json();
      
      // 🎯 FIXED: Extract the nested post record node explicitly from the server object envelope
      onPostCreated(data.post); 
      
      setContent('');
      handleRemoveImage();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} data-testid="new-post-form">
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        placeholder="What's on your mind?" 
        className={styles.textarea} 
        maxLength={280} 
        data-testid="new-post-input" 
      />

      {imagePreview && (
        <div className={styles.previewContainer} data-testid="image-preview-wrapper">
          <img src={imagePreview} alt="Upload preview" className={styles.previewImage} />
          <button 
            type="button" 
            onClick={handleRemoveImage} 
            className={styles.removeImageBtn} 
            data-testid="remove-image-btn"
            aria-label="Remove uploaded image"
          >
            <X className={styles.closeIcon} size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className={styles.actionBar}>
        <label className={styles.uploadLabel} data-testid="upload-label">
          <Image className={styles.cameraIcon} size={16} aria-hidden="true" />
          <span className={styles.uploadLabelText}>Add Image</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className={styles.fileInput} 
            data-testid="image-file-input" 
          />
        </label>
        
        <button 
          type="submit" 
          className={styles.submitBtn} 
          disabled={isSubmitting || (!content.trim() && !imageFile)} 
          data-testid="new-post-submit"
        >
          {isSubmitting ? 'Posting...' : 'Share'}
        </button>
      </div>
    </form>
  );
}
