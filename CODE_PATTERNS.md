# 🔥 Code Patterns & Examples

This document highlights key patterns and code snippets from the project that you can reuse in your own applications.

## 🎣 Custom React Hooks

### Network Status Detection

```typescript
// src/hooks/useOnlineStatus.ts
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Usage in component:
const isOnline = useOnlineStatus();
```

### IndexedDB Data Hook

```typescript
// src/hooks/usePosts.ts
export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    const allPosts = await dbUtils.getAllPosts();
    setPosts(allPosts);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    
    // Listen for updates
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'POST_SYNCED') {
        loadPosts();
      }
    });
  }, []);

  return { posts, loading, refreshPosts: loadPosts };
};
```

## 🗄️ IndexedDB Patterns (Dexie)

### Database Setup

```typescript
// src/utils/db.ts
import Dexie, { Table } from 'dexie';

interface Post {
  id: string;
  title: string;
  description: string;
  synced: boolean;
  createdAt: number;
}

class OfflineDatabase extends Dexie {
  posts!: Table<Post, string>;

  constructor() {
    super('OfflineFirstDB');
    this.version(1).stores({
      posts: 'id, synced, createdAt'  // Indexed fields
    });
  }
}

export const db = new OfflineDatabase();
```

### CRUD Operations

```typescript
// Add
await db.posts.add({
  id: uuidv4(),
  title: 'My Post',
  description: 'Content',
  synced: false,
  createdAt: Date.now()
});

// Get all
const posts = await db.posts.toArray();

// Get with filter
const unsyncedPosts = await db.posts
  .where('synced')
  .equals(false)
  .toArray();

// Update
await db.posts.update(id, { synced: true });

// Delete
await db.posts.delete(id);

// Get one
const post = await db.posts.get(id);
```

## 🔄 Sync Patterns

### Basic Sync Manager

```typescript
// src/utils/sync.ts
export class SyncManager {
  async syncUnsyncedPosts() {
    const unsyncedPosts = await dbUtils.getUnsyncedPosts();
    
    for (const post of unsyncedPosts) {
      try {
        await api.createPost(post);
        await dbUtils.markPostAsSynced(post.id);
      } catch (error) {
        await dbUtils.updateSyncAttempt(post.id);
      }
    }
  }

  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-posts');
    } else {
      // Fallback for browsers without Background Sync
      await this.syncUnsyncedPosts();
    }
  }
}
```

### Online Detection + Auto-Sync

```typescript
// src/App.tsx
useEffect(() => {
  if (isOnline) {
    // Wait a moment for connection to stabilize
    const timeoutId = setTimeout(() => {
      syncManager.registerBackgroundSync();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }
}, [isOnline]);
```

## 🔧 Service Worker Patterns

### Service Worker Registration

```typescript
// src/App.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  }
}, []);
```

### Background Sync Event

```typescript
// src/sw.ts
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  const { db } = await import('./utils/db');
  const unsyncedPosts = await db.posts
    .where('synced')
    .equals(false)
    .toArray();

  const syncPromises = unsyncedPosts.map(async (post) => {
    const response = await fetch('http://localhost:3001/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });

    if (response.ok) {
      await db.posts.update(post.id, { synced: true });
    }
  });

  await Promise.all(syncPromises);
}
```

### Cache Strategies

```typescript
// Network First (for API)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response
          const clone = response.clone();
          caches.open('api-cache').then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(event.request);
        })
    );
  }
});

// Cache First (for static assets)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
  );
});
```

### Service Worker → Client Communication

```typescript
// In Service Worker
async function notifyClients(message: any) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Notify after sync
await notifyClients({ type: 'POST_SYNCED', postId: post.id });

// In React Component
useEffect(() => {
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'POST_SYNCED') {
      console.log('Post synced:', event.data.postId);
      refreshPosts();
    }
  });
}, []);
```

## 🌐 API Patterns

### Idempotent POST Endpoint

```javascript
// server/index.js
app.post('/api/posts', (req, res) => {
  const { id, title, description, createdAt } = req.body;

  // Check if already exists (idempotency)
  if (postsStore.has(id)) {
    return res.status(200).json({
      success: true,
      message: 'Post already exists',
      post: postsStore.get(id),
      duplicate: true
    });
  }

  // Create new
  const newPost = { id, title, description, createdAt, syncedAt: Date.now() };
  postsStore.set(id, newPost);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post: newPost,
    duplicate: false
  });
});
```

### Fetch with Error Handling

```typescript
// src/utils/api.ts
export const api = {
  async createPost(post: Post): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return true;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
```

## 💾 Offline-First Form Handling

```typescript
// src/App.tsx
const handleSubmit = async (title: string, description: string) => {
  const newPost = {
    id: uuidv4(),
    title,
    description,
    synced: false,
    createdAt: Date.now(),
  };

  if (isOnline) {
    try {
      // Try server first
      await api.createPost(newPost);
      await dbUtils.addPost({ ...newPost, synced: true });
    } catch (error) {
      // If server fails, save offline
      await dbUtils.addPost(newPost);
      await syncManager.registerBackgroundSync();
    }
  } else {
    // Offline - save locally
    await dbUtils.addPost(newPost);
    await syncManager.registerBackgroundSync();
  }

  await refreshPosts();
};
```

## 🎨 UI Status Indicators

### Network Status Badge

```tsx
// src/components/NetworkStatus.tsx
const NetworkStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  return (
    <div className={`status ${isOnline ? 'online' : 'offline'}`}>
      <span className="indicator"></span>
      <span>
        {isOnline 
          ? 'Online' 
          : 'Offline - Changes will sync when connection returns'}
      </span>
    </div>
  );
};
```

### Sync Status Badge

```tsx
// src/components/PostList.tsx
<span className={`badge ${post.synced ? 'synced' : 'pending'}`}>
  {post.synced ? '✓ Synced' : '⏳ Pending'}
</span>
```

## 🧪 Testing Patterns

### Mock Online/Offline

```typescript
// For testing
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});

// Trigger events
window.dispatchEvent(new Event('offline'));
window.dispatchEvent(new Event('online'));
```

### IndexedDB Testing

```typescript
// Clear database before tests
beforeEach(async () => {
  await db.posts.clear();
});

// Test add operation
test('should add post', async () => {
  const post = {
    id: 'test-123',
    title: 'Test',
    description: 'Test desc',
    synced: false,
    createdAt: Date.now()
  };
  
  await dbUtils.addPost(post);
  const posts = await dbUtils.getAllPosts();
  
  expect(posts).toHaveLength(1);
  expect(posts[0].id).toBe('test-123');
});
```

## 🔐 Production Patterns

### Environment Variables

```typescript
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

// Usage
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Error Boundaries

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh.</h1>;
    }
    return this.props.children;
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 📚 Key Takeaways

1. **Always store data locally first** - Never rely solely on network
2. **Use UUIDs from client** - Enables idempotency and offline creation
3. **Background Sync is your friend** - But have fallbacks
4. **IndexedDB over localStorage** - For structured, reliable storage
5. **Service Workers are powerful** - Learn caching strategies
6. **Type safety matters** - TypeScript catches errors early
7. **User feedback is crucial** - Show sync status clearly
8. **Test offline scenarios** - Don't just test happy paths

## 🚀 Reusable Components

You can extract these patterns into:

- `useOfflineSync` hook
- `OfflineFormWrapper` component
- `SyncStatusIndicator` component
- `NetworkAwareButton` component
- Generic `useIndexedDB` hook

---

These patterns form the foundation of any offline-first application. Mix and match based on your needs!
