# Architecture & Technical Documentation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  (React Components: PostForm, PostList, NetworkStatus)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│         (App.tsx - Main coordination logic)             │
└──┬────────────────┬─────────────────┬───────────────────┘
   │                │                 │
   │                │                 │
   ▼                ▼                 ▼
┌──────────┐  ┌──────────┐     ┌──────────┐
│ Sync     │  │ Database │     │   API    │
│ Manager  │  │ (Dexie)  │     │  Client  │
│          │  │          │     │          │
│ sync.ts  │  │  db.ts   │     │ api.ts   │
└──────────┘  └──────────┘     └──────────┘
      │              │                │
      │              │                │
      ▼              ▼                ▼
┌─────────────────────────────────────────────────────────┐
│              Service Worker (sw.ts)                      │
│  • Cache Management                                      │
│  • Background Sync                                       │
│  • Offline Fallbacks                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  IndexedDB Storage                       │
│              (Browser's Local Database)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼ (when online)
┌─────────────────────────────────────────────────────────┐
│                  Express Backend API                     │
│  • POST /api/posts (Idempotent)                         │
│  • GET  /api/posts                                       │
│  • GET  /api/health                                      │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Creating a Post (Online)

```
1. User submits form
   ↓
2. App.tsx handleSubmit()
   ↓
3. Check: navigator.onLine === true
   ↓
4. api.createPost() → POST to backend
   ↓
5. Backend receives, stores, returns 201
   ↓
6. dbUtils.addPost() → Save to IndexedDB with synced=true
   ↓
7. UI updates with new post (synced badge)
```

### Creating a Post (Offline)

```
1. User submits form
   ↓
2. App.tsx handleSubmit()
   ↓
3. Check: navigator.onLine === false
   ↓
4. dbUtils.addPost() → Save to IndexedDB with synced=false
   ↓
5. syncManager.registerBackgroundSync()
   ↓
6. Service Worker registers 'sync-posts' event
   ↓
7. UI updates with new post (pending badge)
   ↓
8. Post queued for sync when connection returns
```

### Automatic Sync (Connection Restored)

```
1. Browser detects network online
   ↓
2. useOnlineStatus hook fires
   ↓
3. useEffect in App.tsx triggers
   ↓
4. syncManager.registerBackgroundSync()
   ↓
5. Service Worker 'sync' event fires
   ↓
6. sw.ts syncPosts() function executes
   ↓
7. Query IndexedDB for unsynced posts
   ↓
8. For each unsynced post:
   → POST to backend
   → If success: update synced=true in IndexedDB
   → If fail: increment syncAttempts
   ↓
9. Service Worker posts message to client
   ↓
10. App receives message, refreshes post list
    ↓
11. UI updates - pending badges become synced
```

## 🗄️ IndexedDB Schema

### Database: `OfflineFirstDB`

**Table: `posts`**

```typescript
{
  id: string,           // Primary key - UUID v4
  title: string,        // Post title
  description: string,  // Post content
  synced: boolean,      // Sync status
  createdAt: number,    // Unix timestamp
  syncAttempts: number, // Retry counter (optional)
  lastSyncAttempt: number // Last retry timestamp (optional)
}
```

**Indexes:**
- `id` - Primary key, unique
- `synced` - Indexed for quick unsynced queries
- `createdAt` - Indexed for chronological ordering

## 🔌 API Endpoints

### POST `/api/posts`

**Purpose:** Create a new post (idempotent)

**Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Post",
  "description": "Post content",
  "createdAt": 1703001234567
}
```

**Response (201 Created - New Post):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Post",
    "description": "Post content",
    "createdAt": 1703001234567,
    "syncedAt": 1703001235000
  },
  "duplicate": false
}
```

**Response (200 OK - Duplicate):**
```json
{
  "success": true,
  "message": "Post already exists",
  "post": { /* existing post */ },
  "duplicate": true
}
```

**Idempotency Strategy:**
- Client generates UUID before sending
- Server checks if UUID exists
- If exists, returns 200 with existing data
- If new, creates and returns 201
- Multiple identical requests = same result

### GET `/api/posts`

**Response:**
```json
[
  {
    "id": "uuid-1",
    "title": "Post 1",
    "description": "Content 1",
    "createdAt": 1703001234567,
    "syncedAt": 1703001235000
  },
  // ... more posts
]
```

### GET `/api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1703001234567
}
```

## 🔧 Service Worker Implementation

### Lifecycle Events

**Install:**
```typescript
self.addEventListener('install', (event) => {
  // 1. Cache static assets
  // 2. Skip waiting to activate immediately
});
```

**Activate:**
```typescript
self.addEventListener('activate', (event) => {
  // 1. Clean up old caches
  // 2. Claim all clients
});
```

**Fetch:**
```typescript
self.addEventListener('fetch', (event) => {
  // API requests: Network first, then cache
  // Static assets: Cache first, then network
  // Offline fallback for failed requests
});
```

**Sync (Background):**
```typescript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    // 1. Query IndexedDB for unsynced posts
    // 2. POST each to backend
    // 3. Update sync status
    // 4. Notify clients
  }
});
```

### Caching Strategy

**Static Assets (Cache First):**
- HTML, CSS, JavaScript
- Images, fonts
- Serves instantly from cache
- Updates cache in background

**API Requests (Network First):**
- Always try network first
- Fall back to cache if offline
- Cache successful responses

## 🔐 Security Considerations

### Current Implementation (Demo)
- No authentication
- No authorization
- In-memory storage (data lost on restart)
- No input validation (basic only)

### Production Recommendations

**Authentication:**
```typescript
// Add JWT or session tokens
const token = await getAuthToken();
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Input Validation:**
```typescript
// Validate and sanitize all inputs
if (title.length > 100) throw new Error('Title too long');
const sanitizedDescription = sanitize(description);
```

**Rate Limiting:**
```javascript
// Backend - prevent abuse
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

**HTTPS Only:**
```javascript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## ⚡ Performance Optimizations

### 1. Lazy Loading
```typescript
// Load service worker code on demand
const { syncManager } = await import('./utils/sync');
```

### 2. Debouncing Sync
```typescript
// Don't sync too frequently
let syncTimeout: NodeJS.Timeout;
const debouncedSync = () => {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncManager.registerBackgroundSync();
  }, 1000);
};
```

### 3. Batch Syncing
```typescript
// Sync multiple posts in parallel
const syncPromises = unsyncedPosts.map(post => api.createPost(post));
await Promise.allSettled(syncPromises);
```

### 4. IndexedDB Indexing
```typescript
// Create compound indexes for complex queries
this.version(1).stores({
  posts: 'id, synced, [synced+createdAt]'
});
```

## 🧪 Testing Strategies

### Unit Tests

```typescript
// Test IndexedDB operations
describe('dbUtils', () => {
  it('should add post to database', async () => {
    const post = createMockPost();
    const id = await dbUtils.addPost(post);
    expect(id).toBe(post.id);
  });
});
```

### Integration Tests

```typescript
// Test sync flow
describe('Sync Manager', () => {
  it('should sync unsynced posts', async () => {
    // 1. Add unsynced post to DB
    // 2. Trigger sync
    // 3. Verify post marked as synced
  });
});
```

### E2E Tests (Playwright/Cypress)

```typescript
// Test offline functionality
test('creates post while offline', async ({ page, context }) => {
  await context.setOffline(true);
  await page.fill('#title', 'Offline Post');
  await page.click('button[type="submit"]');
  await expect(page.locator('.sync-badge.pending')).toBeVisible();
});
```

## 📊 Monitoring & Debugging

### Key Metrics to Track

1. **Sync Success Rate**
```typescript
const syncSuccessRate = (syncedPosts / totalPosts) * 100;
```

2. **Sync Latency**
```typescript
const syncLatency = syncCompletedAt - connectionRestoredAt;
```

3. **Offline Usage**
```typescript
const offlineUsage = offlineTime / totalTime;
```

4. **Failed Syncs**
```typescript
const failedSyncs = posts.filter(p => p.syncAttempts > 3);
```

### Debug Logging

```typescript
// Enable verbose logging
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] Sync status:', { unsyncedCount, syncAttempts });
}
```

## 🚀 Scaling Considerations

### Database
- Replace in-memory storage with PostgreSQL/MongoDB
- Add indexes for frequently queried fields
- Implement connection pooling

### Backend
- Add horizontal scaling with load balancer
- Implement message queue for async processing
- Use Redis for caching

### Frontend
- Implement virtual scrolling for large post lists
- Add pagination/infinite scroll
- Optimize bundle size with code splitting

---

This architecture provides a solid foundation for building production-ready offline-first applications. Adapt and extend based on your specific requirements!
