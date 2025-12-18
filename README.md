# Offline-First React Application

A production-ready offline-first React application with automatic background synchronization. This app works seamlessly online and offline, automatically syncing data when connectivity is restored.

## 🌟 Features

- ✅ **Full Offline Support** - App works completely offline
- ✅ **Automatic Sync** - Data syncs automatically when connection returns
- ✅ **Background Sync** - Uses Service Worker Background Sync API
- ✅ **IndexedDB Storage** - Reliable local data persistence with Dexie
- ✅ **Network Detection** - Real-time online/offline status indicator
- ✅ **Idempotent API** - Duplicate requests are handled gracefully
- ✅ **TypeScript** - Full type safety
- ✅ **Production Ready** - Clean code, proper error handling

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Dexie (IndexedDB wrapper)
- Service Workers
- Background Sync API

**Backend:**
- Express.js
- In-memory storage (demonstrative)
- CORS enabled
- Idempotent endpoints

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern browser with Service Worker support

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

```bash
npm run server
```

The server will start on `http://localhost:3001`

### 3. Start the Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📖 How It Works

### Offline-First Architecture

1. **Online Mode:**
   - User creates a post
   - POST request sent directly to backend
   - On success, saved to IndexedDB with `synced: true`
   - On failure, saved with `synced: false` and queued for sync

2. **Offline Mode:**
   - User creates a post
   - Data saved immediately to IndexedDB with `synced: false`
   - Service Worker registers a background sync task
   - No data is lost

3. **Connection Restored:**
   - App detects online status
   - Service Worker automatically triggers sync
   - All unsynced posts are sent to backend
   - After successful POST, marked as `synced: true`
   - UI updates automatically

### Key Components

#### IndexedDB (Dexie)
```typescript
// src/utils/db.ts
- Stores posts with sync status
- Queries unsynced posts
- Updates sync status
```

#### Service Worker
```typescript
// src/sw.ts
- Caches static assets
- Handles background sync events
- Retries failed syncs automatically
- Notifies app of sync completion
```

#### Sync Manager
```typescript
// src/utils/sync.ts
- Coordinates synchronization
- Registers background sync
- Handles sync status callbacks
```

#### Network Detection
```typescript
// src/hooks/useOnlineStatus.ts
- Monitors online/offline events
- Triggers sync when connection returns
```

## 🧪 Testing Offline Functionality

### Method 1: Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Select **Offline** from the throttling dropdown
4. Create posts while offline
5. Switch back to **Online**
6. Watch posts sync automatically

### Method 2: Service Worker

1. Open DevTools > **Application** > **Service Workers**
2. Check "Offline" checkbox
3. Create posts
4. Uncheck "Offline"
5. Posts sync automatically

### Method 3: Network Disconnect

1. Disconnect from WiFi/Network
2. Create posts
3. Reconnect
4. Posts sync automatically

## 📁 Project Structure

```
offline-app-poc/
├── src/
│   ├── components/
│   │   ├── NetworkStatus.tsx       # Online/offline indicator
│   │   ├── NetworkStatus.css
│   │   ├── PostForm.tsx            # Create post form
│   │   ├── PostForm.css
│   │   ├── PostList.tsx            # Display posts with sync status
│   │   └── PostList.css
│   ├── hooks/
│   │   ├── useOnlineStatus.ts      # Network status hook
│   │   └── usePosts.ts             # Posts data hook
│   ├── utils/
│   │   ├── db.ts                   # IndexedDB utilities (Dexie)
│   │   ├── api.ts                  # API client functions
│   │   └── sync.ts                 # Sync manager
│   ├── sw.ts                       # Service Worker
│   ├── App.tsx                     # Main app component
│   ├── App.css
│   ├── main.tsx                    # Entry point
│   └── index.css
├── server/
│   └── index.js                    # Express backend
├── index.html
├── vite.config.ts                  # Vite configuration
├── tsconfig.json
└── package.json
```

## 🔑 Key Implementation Details

### Idempotent API

The backend uses client-generated UUIDs to ensure idempotency:

```javascript
// server/index.js
app.post('/api/posts', (req, res) => {
  // Check if post already exists
  if (postsStore.has(id)) {
    return res.status(200).json({
      success: true,
      message: 'Post already exists',
      duplicate: true
    });
  }
  // Create new post...
});
```

### Background Sync

Service Worker listens for sync events:

```typescript
// src/sw.ts
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});
```

### Data Persistence

Posts are stored with metadata:

```typescript
interface Post {
  id: string;              // UUID
  title: string;
  description: string;
  synced: boolean;         // Sync status
  createdAt: number;       // Timestamp
  syncAttempts?: number;   // Retry count
}
```

## 🎯 Production Deployment

### Frontend

1. Build the app:
```bash
npm run build
```

2. Deploy the `dist/` folder to your hosting service
3. Update API URL in environment variables

### Backend

1. Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
2. Add authentication/authorization
3. Implement rate limiting
4. Add logging and monitoring
5. Deploy to your server/cloud platform

### Environment Variables

Create `.env` file:
```
VITE_API_URL=https://your-api-domain.com
```

## 🐛 Troubleshooting

**Service Worker not updating:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check DevTools > Application > Service Workers > "Update on reload"

**Posts not syncing:**
- Check browser console for errors
- Verify backend is running on port 3001
- Check Network tab for failed requests
- Ensure Background Sync is supported (not available in private/incognito mode on some browsers)

**IndexedDB issues:**
- Clear IndexedDB: DevTools > Application > IndexedDB > Right-click > Delete
- Check browser storage quota

## 📚 Browser Support

- Chrome/Edge 49+
- Firefox 44+
- Safari 11.1+
- Opera 36+

**Note:** Background Sync API support varies. The app includes fallbacks for browsers without full support.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and adapt for your needs.

## 📄 License

MIT License - feel free to use this code for your projects.

## 🎓 Learning Resources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Dexie.js Documentation](https://dexie.org/)

---

Built with ❤️ using React, TypeScript, and modern web APIs
