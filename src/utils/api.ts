import { v4 as uuidv4 } from 'uuid';
import { Post } from './db';

/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API utility functions
 */
export const api = {
  /**
   * Send a post to the backend API
   */
  async createPost(post: Omit<Post, 'synced'>): Promise<boolean> {
    try {
      console.log('[API] Sending POST to', API_BASE_URL, 'with post:', post);
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      console.log('[API] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API] Post created successfully:', data);
      return true;
    } catch (error) {
      console.error('[API] Error creating post:', error);
      throw error;
    }
  },

  /**
   * Get all posts from the backend
   */
  async getAllPosts(): Promise<Post[]> {
    try {
      console.log('[API] Fetching posts from', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      
      console.log('[API] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API] Fetched posts:', data);
      return data;
    } catch (error) {
      console.error('[API] Error fetching posts:', error);
      throw error;
    }
  },

  /**
   * Check if the server is reachable
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('[API] Checking health at', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        cache: 'no-cache',
      });
      console.log('[API] Health check response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('[API] Health check failed:', error);
      return false;
    }
  }
};

/**
 * Generate a new post object
 */
export const createPostObject = (
  title: string,
  description: string
): Post => {
  return {
    id: uuidv4(),
    title,
    description,
    synced: 0,
    createdAt: Date.now(),
    syncAttempts: 0,
  };
};
