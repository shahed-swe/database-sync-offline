import { useState, useEffect } from 'react';
import { dbUtils } from '../utils/db';
import { Post } from '../utils/db';
import { api } from '../utils/api';

/**
 * Custom hook to manage posts from IndexedDB
 */
export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const allPosts = await dbUtils.getAllPosts();
      // If no local posts and we're online, try to fetch from server and seed IndexedDB
      if ((allPosts.length === 0 || !allPosts) && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const serverPosts = await api.getAllPosts();
          if (Array.isArray(serverPosts) && serverPosts.length > 0) {
            // Seed local DB with server posts (mark as synced)
            for (const p of serverPosts) {
              const localPost: Post = {
                id: p.id,
                title: p.title,
                description: p.description,
                createdAt: p.createdAt || Date.now(),
                synced: 1,
              } as Post;
              // avoid duplicate errors
              const exists = await dbUtils.postExists(localPost.id);
              if (!exists) await dbUtils.addPost(localPost);
            }
            const refreshed = await dbUtils.getAllPosts();
            setPosts(refreshed);
            return;
          }
        } catch (err) {
          console.error('[Hook] Failed to fetch server posts:', err);
          // fallthrough to set empty local posts
        }
      }

      setPosts(allPosts);
    } catch (error) {
      console.error('[Hook] Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();

    // Listen for service worker messages about sync updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'POST_SYNCED') {
          console.log('[Hook] Post synced notification received');
          loadPosts();
        }
      });
    }
  }, []);

  return { posts, loading, refreshPosts: loadPosts };
};
