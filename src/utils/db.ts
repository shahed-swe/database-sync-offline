import Dexie, { Table } from 'dexie';

/**
 * Post interface representing a post entry
 */
export interface Post {
  id: string; // UUID generated on client
  title: string;
  description: string;
  synced: number; // Whether the post has been synced to server (0 = false, 1 = true)
  createdAt: number; // Timestamp
  syncAttempts?: number; // Track number of sync attempts
  lastSyncAttempt?: number; // Last attempt timestamp
}

/**
 * Dexie database class for offline storage
 */
class OfflineDatabase extends Dexie {
  posts!: Table<Post, string>;

  constructor() {
    super('OfflineFirstDB');
    
    // Define database schema
    this.version(1).stores({
      posts: 'id, synced, createdAt' // Index by id, synced status, and creation time
    });
  }
}

// Create and export database instance
export const db = new OfflineDatabase();

/**
 * Database utility functions
 */
export const dbUtils = {
  /**
   * Add a new post to IndexedDB
   */
  async addPost(post: Post): Promise<string> {
    try {
      await db.posts.add(post);
      console.log('[DB] Post added:', post.id);
      return post.id;
    } catch (error) {
      console.error('[DB] Error adding post:', error);
      throw error;
    }
  },

  /**
   * Get all posts from IndexedDB
   */
  async getAllPosts(): Promise<Post[]> {
    try {
      const posts = await db.posts.orderBy('createdAt').reverse().toArray();
      return posts;
    } catch (error) {
      console.error('[DB] Error getting posts:', error);
      throw error;
    }
  },

  /**
   * Get all unsynced posts
   */
  async getUnsyncedPosts(): Promise<Post[]> {
    try {
      const posts = await db.posts.where('synced').equals(0).toArray();
      console.log(`[DB] Found ${posts.length} unsynced posts`);
      return posts;
    } catch (error) {
      console.error('[DB] Error getting unsynced posts:', error);
      throw error;
    }
  },

  /**
   * Mark a post as synced
   */
  async markPostAsSynced(id: string): Promise<void> {
    try {
      await db.posts.update(id, { synced: 1 });
      console.log('[DB] Post marked as synced:', id);
    } catch (error) {
      console.error('[DB] Error marking post as synced:', error);
      throw error;
    }
  },

  /**
   * Update sync attempt information
   */
  async updateSyncAttempt(id: string): Promise<void> {
    try {
      const post = await db.posts.get(id);
      if (post) {
        await db.posts.update(id, {
          syncAttempts: (post.syncAttempts || 0) + 1,
          lastSyncAttempt: Date.now()
        });
      }
    } catch (error) {
      console.error('[DB] Error updating sync attempt:', error);
      throw error;
    }
  },

  /**
   * Delete a post by ID
   */
  async deletePost(id: string): Promise<void> {
    try {
      await db.posts.delete(id);
      console.log('[DB] Post deleted:', id);
    } catch (error) {
      console.error('[DB] Error deleting post:', error);
      throw error;
    }
  },

  /**
   * Check if a post exists
   */
  async postExists(id: string): Promise<boolean> {
    try {
      const post = await db.posts.get(id);
      return !!post;
    } catch (error) {
      console.error('[DB] Error checking post existence:', error);
      return false;
    }
  },

  /**
   * Clear all posts (for testing)
   */
  async clearAllPosts(): Promise<void> {
    try {
      await db.posts.clear();
      console.log('[DB] All posts cleared');
    } catch (error) {
      console.error('[DB] Error clearing posts:', error);
      throw error;
    }
  }
};
