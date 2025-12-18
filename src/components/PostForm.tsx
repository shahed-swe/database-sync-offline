import React, { useState } from 'react';
import './PostForm.css';

interface PostFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  isOnline: boolean;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, isOnline }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(title, description);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-form-container">
      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter post description"
            disabled={isSubmitting}
            rows={5}
            maxLength={500}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>

        {!isOnline && (
          <p className="offline-notice">
            📱 You're offline. Your post will be saved locally and synced automatically when connection returns.
          </p>
        )}
      </form>
    </div>
  );
};

export default PostForm;
