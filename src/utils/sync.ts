import { dbUtils } from './db';
import { api } from './api';

/**
 * Sync manager for handling online/offline synchronization
 */
export class SyncManager {
  private syncInProgress = false;
  private syncCallback?: (status: 'syncing' | 'synced' | 'error') => void;

  /**
   * Set a callback for sync status updates
   */
  onSyncStatusChange(callback: (status: 'syncing' | 'synced' | 'error') => void) {
    this.syncCallback = callback;
  }

  /**
   * Attempt to sync all unsynced posts
   */
  async syncUnsyncedPosts(): Promise<void> {
    console.log('[Sync] syncUnsyncedPosts called, syncInProgress:', this.syncInProgress);
    
    if (this.syncInProgress) {
      console.log('[Sync] Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    this.syncCallback?.('syncing');

    try {
      const unsyncedPosts = await dbUtils.getUnsyncedPosts();
      console.log('[Sync] Found unsynced posts:', unsyncedPosts.length);

      if (unsyncedPosts.length === 0) {
        console.log('[Sync] No posts to sync');
        this.syncInProgress = false;
        this.syncCallback?.('synced');
        return;
      }

      console.log(`[Sync] Starting sync for ${unsyncedPosts.length} posts...`);

      // Sync each post sequentially to avoid overwhelming the server
      for (const post of unsyncedPosts) {
        try {
          console.log('[Sync] Syncing post:', post.id, post.title);
          const result = await api.createPost({
            id: post.id,
            title: post.title,
            description: post.description,
            createdAt: post.createdAt,
          });
          console.log('[Sync] POST request succeeded for:', post.id);

          // Mark as synced
          await dbUtils.markPostAsSynced(post.id);
          console.log('[Sync] Post marked as synced in DB:', post.id);
        } catch (error) {
          console.error('[Sync] Failed to sync post:', post.id, error);
          // Update sync attempt
          await dbUtils.updateSyncAttempt(post.id);
        }
      }

      console.log('[Sync] All posts synced, calling callback');
      this.syncCallback?.('synced');
    } catch (error) {
      console.error('[Sync] Sync failed with error:', error);
      this.syncCallback?.('error');
    } finally {
      this.syncInProgress = false;
      console.log('[Sync] syncUnsyncedPosts complete');
    }
  }

  /**
   * Register background sync with Service Worker
   */
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-posts');
        console.log('[Sync] Background sync registered');
      } catch (error) {
        console.error('[Sync] Failed to register background sync:', error);
        // Fallback to immediate sync
        await this.syncUnsyncedPosts();
      }
    } else {
      console.warn('[Sync] Background sync not supported, using immediate sync');
      await this.syncUnsyncedPosts();
    }
  }

  /**
   * Request immediate sync via Service Worker message
   */
  async requestImmediateSync(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOW',
      });
    }
    // Also trigger local sync
    await this.syncUnsyncedPosts();
  }
}

// Create singleton instance
export const syncManager = new SyncManager();
