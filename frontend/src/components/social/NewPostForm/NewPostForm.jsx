import { useState, useRef, useEffect } from 'react';
import { customFetch } from '../../../utils/api/api';
import styles from './NewPostForm.module.css';
import { Image, X } from 'lucide-react';
import heic2any from 'heic2any';

export default function NewPostForm({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = async (e) => {
    const fileListCollection = e.target.files;
    if (!fileListCollection || fileListCollection.length === 0) return;

    let singleFileBlob = fileListCollection.item(0);
    if (!singleFileBlob) return;

    const isHeic = 
      singleFileBlob.type === 'image/heic' || 
      singleFileBlob.type === 'image/heif' ||
      singleFileBlob.name.toLowerCase().endsWith('.heic') ||
      singleFileBlob.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        setIsConverting(true);
        
        const convertedBlob = await heic2any({
          blob: singleFileBlob,
          toType: 'image/jpeg',
          quality: 0.8
        });

        const newFileName = singleFileBlob.name.replace(/\.(heic|heif)$/i, '.jpg');
        singleFileBlob = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
        
      } catch (conversionError) {
        console.error('HEIC pipeline translation exception:', conversionError);
        alert('Failed to process Apple HEIC image format. Please use JPEG or PNG.');
        setIsConverting(false);
        return;
      } finally {
        setIsConverting(false);
      }
    }

    setImageFile(singleFileBlob);
    const originObjectURL = URL.createObjectURL(singleFileBlob);
    setImagePreview(originObjectURL);
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
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

      const response = await customFetch('/api/posts', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to publish your post.');
      
      const data = await response.json();
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
      <label htmlFor="main-post-content" className={styles.visuallyHidden}>
        What's on your mind? Write a new community post
      </label>
      
      <textarea
        id="main-post-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className={styles.textarea}
        data-testid="new-post-input"
        rows={3}
      />

      {imagePreview && (
        <div className={styles.previewContainer} data-testid="image-preview-wrapper">
          <img 
            src={imagePreview} 
            alt="Upload preview" 
            className={styles.previewImage}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className={styles.removeImageBtn}
            data-testid="remove-image-btn"
            aria-label="Remove uploaded image"
            disabled={isSubmitting || isConverting}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className={styles.actionBar}>
        <label htmlFor="post-image-upload" className={styles.uploadLabel} data-testid="upload-label">
          <Image size={16} aria-hidden="true" />
          <span className={styles.uploadLabelText}>
            {isConverting ? 'Processing HEIC...' : 'Add Image'}
          </span>
        </label>
        
        <input
          type="file"
          id="post-image-upload"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*,.heic,.heif" /* 🌟 Update accept rules to intercept HEIC files */
          className={styles.fileInput}
          data-testid="image-file-input"
          disabled={isSubmitting || isConverting}
        />

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting || isConverting || (!content.trim() && !imageFile)}
          data-testid="new-post-submit"
        >
          {isSubmitting ? 'Posting...' : 'Share'}
        </button>
      </div>
    </form>
  );
}
