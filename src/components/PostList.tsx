import React from 'react';
import { Post } from '../utils/db';
import './PostList.css';

interface PostListProps {
  posts: Post[];
  loading: boolean;
}

const PostList: React.FC<PostListProps> = ({ posts, loading }) => {
  if (loading) {
    return (
      <div className="post-list-container">
        <h2>Your Posts</h2>
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list-container">
        <h2>Your Posts</h2>
        <div className="empty-state">
          <p>No posts yet. Create your first post above!</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="post-list-container">
      <h2>Your Posts ({posts.length})</h2>
      <div className="posts-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h3 className="post-title">{post.title}</h3>
              <span className={`sync-badge ${post.synced === 1 ? 'synced' : 'pending'}`}>
                {post.synced === 1 ? '✓ Synced' : '⏳ Pending'}
              </span>
            </div>
            <p className="post-description">{post.description}</p>
            <div className="post-footer">
              <span className="post-date">{formatDate(post.createdAt)}</span>
              {post.synced === 0 && post.syncAttempts && post.syncAttempts > 0 && (
                <span className="sync-attempts">
                  {post.syncAttempts} sync attempt{post.syncAttempts > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostList;
