import { useEffect } from 'react';
import NetworkStatus from './components/NetworkStatus';
import PostForm from './components/PostForm';
import PostList from './components/PostList';
import SyncButton from './components/SyncButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePosts } from './hooks/usePosts';
import { dbUtils } from './utils/db';
import { api, createPostObject } from './utils/api';
import { syncManager } from './utils/sync';
import './App.css';

function App() {
  const isOnline = useOnlineStatus();
  const { posts, loading, refreshPosts } = usePosts();

  useEffect(() => {
    // Register service worker and attempt immediate takeover so background sync is available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        async (registration) => {
          console.log('[App] Service Worker registered:', registration);

          // Track if we've already reloaded to avoid loops
          const reloadedFlag = sessionStorage.getItem('sw-reloaded-once');
          const isControlled = !!navigator.serviceWorker.controller;

          if (!isControlled && !reloadedFlag) {
            console.log('[App] Page not controlled by SW — requesting skipWaiting and will reload once');
            sessionStorage.setItem('sw-reloaded-once', 'true');
          }

          // If there's a waiting worker, ask it to skip waiting
          try {
            if ((registration as any).waiting) {
              console.log('[App] Requesting waiting SW to skip waiting');
              (registration as any).waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for updates (installing worker)
            registration.addEventListener('updatefound', () => {
              const newSW = registration.installing;
              if (newSW) {
                newSW.addEventListener('statechange', () => {
                  if (newSW.state === 'installed' && (registration as any).waiting) {
                    console.log('[App] New SW installed, requesting skip waiting');
                    (registration as any).waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });

            // When the controlling service worker changes, refresh posts so UI is up-to-date
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('[App] Service worker controller changed — refreshing posts');
              if (!isControlled && !reloadedFlag) {
                console.log('[App] First time becoming controlled, reloading page to ensure full SW control');
                window.location.reload();
              }
              // Use refreshPosts to rehydrate UI without full page reload
              refreshPosts().catch((err) => console.error('[App] refreshPosts after controllerchange failed', err));
            });
          } catch (err) {
            console.warn('[App] Error while attempting SW takeover:', err);
          }
        },
        (error) => {
          console.error('[App] Service Worker registration failed:', error);
        }
      );
    }

    // Set up sync status callback
    syncManager.onSyncStatusChange((status) => {
      console.log('[App] Sync status:', status);
      if (status === 'synced') {
        refreshPosts();
      }
    });
  }, [refreshPosts]);

  useEffect(() => {
    // When network comes back online, trigger sync
    if (isOnline) {
      console.log('[App] Network online - triggering sync');

      // Trigger immediate sync first (fast path), then attempt to register background sync as a fallback
      (async () => {
        try {
          await syncManager.syncUnsyncedPosts();
        } catch (err) {
          console.error('[App] Immediate sync failed:', err);
        }

        try {
          await syncManager.registerBackgroundSync();
        } catch (err) {
          console.error('[App] Background sync registration failed:', err);
        }

        // Always refresh posts after attempting sync
        try {
          await refreshPosts();
        } catch (err) {
          console.error('[App] Failed to refresh posts after sync:', err);
        }
      })();
    }
  }, [isOnline]);

  // Ensure we respond immediately to the browser 'online' event outside React renders
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[App] window online event - forcing immediate sync');

      try {
        // Ask the service worker to attempt immediate sync (if controller present)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          try {
            navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
            console.log('[App] Posted SYNC_NOW to service worker');
          } catch (err) {
            console.warn('[App] Failed to post message to SW:', err);
          }
        }

        // Also trigger local immediate sync (fast path)
        await syncManager.syncUnsyncedPosts();
      } catch (err) {
        console.error('[App] Immediate sync on window online failed:', err);
      } finally {
        try {
          await refreshPosts();
        } catch (err) {
          console.error('[App] refreshPosts after online event failed:', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshPosts]);

  const handleSubmit = async (title: string, description: string) => {
    const newPost = createPostObject(title, description);

    if (isOnline) {
      try {
        // Try to send directly to server
        await api.createPost(newPost);
        
        // Save to IndexedDB as synced
        await dbUtils.addPost({ ...newPost, synced: 1 });
        
        console.log('[App] Post created and synced immediately');
      } catch (error) {
        console.error('[App] Failed to create post online, saving offline:', error);
        
        // If server fails, save offline
        await dbUtils.addPost(newPost);
        
        // Try to sync in background
        await syncManager.registerBackgroundSync();
      }
    } else {
      // Offline - save to IndexedDB
      await dbUtils.addPost(newPost);
      
      console.log('[App] Post saved offline');
      
      // Register background sync for when connection returns
      await syncManager.registerBackgroundSync();
    }

    // Refresh the post list
    await refreshPosts();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📱 Offline-First App</h1>
        <p className="app-subtitle">Create posts that sync automatically, even when offline</p>
        <SyncButton isOnline={isOnline} onSyncComplete={refreshPosts} />
      </header>

      <main className="app-main">
        <NetworkStatus isOnline={isOnline} />
        <PostForm onSubmit={handleSubmit} isOnline={isOnline} />
        <PostList posts={posts} loading={loading} />
      </main>

      <footer className="app-footer">
        <p>
          Built with React + TypeScript + IndexedDB + Service Workers
        </p>
      </footer>
    </div>
  );
}

export default App;
