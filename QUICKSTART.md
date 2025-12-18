# Quick Start Guide

## 🚀 Running the Application

Follow these steps to get the offline-first application running:

### Step 1: Install Dependencies

```bash
npm install
```

This will install all necessary packages for both frontend and backend.

### Step 2: Start the Backend Server

Open a terminal and run:

```bash
npm run server
```

You should see:
```
╔════════════════════════════════════════════════╗
║  🚀 Offline-First Backend Server Running      ║
║                                                ║
║  Port: 3001                                    ║
║  Health: http://localhost:3001/api/health      ║
║  Posts API: http://localhost:3001/api/posts    ║
╚════════════════════════════════════════════════╝
```

**Keep this terminal open!**

### Step 3: Start the Frontend

Open a **NEW** terminal and run:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 4: Open the Application

Open your browser and go to: **http://localhost:5173**

You should see the Offline-First App with:
- A green "Online" status banner
- A form to create posts
- An empty post list

## 🧪 Testing Offline Functionality

### Test 1: Create a Post While Online

1. Enter a title: "My First Post"
2. Enter a description: "This is created while online"
3. Click "Create Post"
4. ✅ Post should appear immediately with "✓ Synced" badge

### Test 2: Go Offline and Create Posts

**Method A - Using Chrome DevTools:**

1. Press F12 to open DevTools
2. Go to **Network** tab
3. Change throttling dropdown from "No throttling" to **"Offline"**
4. Notice the banner turns red: "Offline - Changes will sync..."
5. Create a new post:
   - Title: "Offline Post"
   - Description: "Created without internet"
6. Click "Create Post"
7. ✅ Post appears with "⏳ Pending" badge

**Method B - Disconnect Network:**

1. Disconnect your WiFi or ethernet
2. Wait for the banner to turn red
3. Create posts as above

### Test 3: Come Back Online and Watch Auto-Sync

1. Go back online:
   - **DevTools:** Change "Offline" back to "No throttling"
   - **Network:** Reconnect WiFi
2. Watch the magic happen:
   - ✅ Banner turns green
   - ✅ "⏳ Pending" badges automatically change to "✓ Synced"
   - ✅ Check browser console to see sync logs

### Test 4: Refresh the Page

1. Create posts while offline
2. Refresh the page (F5)
3. ✅ All posts are still there (stored in IndexedDB)
4. Go back online
5. ✅ Posts sync automatically

### Test 5: Close Tab and Reopen

1. Create posts while offline
2. Close the browser tab completely
3. Wait a few seconds
4. Reopen http://localhost:5173
5. ✅ All posts are preserved
6. If online, they sync automatically

## 🔍 Inspecting the Database

### View IndexedDB

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Click on **OfflineFirstDB**
5. Click on **posts** table
6. You can see all posts with their sync status

### View Service Worker

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. You should see the service worker running
5. You can:
   - Check "Offline" to simulate offline
   - Click "Unregister" to remove service worker
   - View console logs

## 📊 Backend API Endpoints

Test the backend directly:

```bash
# Health check
curl http://localhost:3001/api/health

# Get all posts
curl http://localhost:3001/api/posts

# Create a post
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "title": "Test Post",
    "description": "Created via cURL",
    "createdAt": 1703001234567
  }'

# Create same post again (idempotent - returns success)
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "title": "Test Post",
    "description": "Created via cURL",
    "createdAt": 1703001234567
  }'
```

## 🐛 Troubleshooting

### Service Worker Not Working

**Symptom:** No sync happening, posts stay pending forever

**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. DevTools > Application > Service Workers > Click "Unregister"
3. Close all tabs with the app
4. Reopen the app
5. Check DevTools > Console for errors

### Backend Not Responding

**Symptom:** All posts stay pending even when online

**Solutions:**
1. Check if backend is running (terminal should show server running)
2. Visit http://localhost:3001/api/health in browser
3. Check for error messages in backend terminal
4. Restart backend: `Ctrl+C` then `npm run server`

### Posts Not Appearing

**Symptom:** Created posts don't show up

**Solutions:**
1. Check browser console for errors
2. Clear IndexedDB: DevTools > Application > IndexedDB > Right-click > Delete
3. Refresh the page
4. Check if JavaScript is enabled

### Background Sync Not Working in Private Mode

**Note:** Background Sync API is **not available** in:
- Chrome/Edge Incognito mode
- Firefox Private Browsing
- Safari Private Browsing

**Solution:** Use regular browsing mode to test background sync

## ✅ Expected Behavior Checklist

- [x] App loads and shows green "Online" banner
- [x] Can create posts while online → immediately synced
- [x] Can create posts while offline → saved with pending status
- [x] Network banner changes color based on connectivity
- [x] Posts sync automatically when connection returns
- [x] Posts persist after page refresh
- [x] Posts persist after tab close/reopen
- [x] Service worker is registered and active
- [x] IndexedDB stores posts correctly
- [x] Backend handles duplicate UUIDs (idempotent)

## 📝 Development Tips

### Viewing Console Logs

The app logs extensively. Check these locations:

**Browser Console (Frontend):**
- `[App]` - Application lifecycle events
- `[DB]` - IndexedDB operations
- `[API]` - Network requests
- `[Sync]` - Synchronization process
- `[Network]` - Online/offline events
- `[Hook]` - React hooks

**Terminal (Backend):**
- `[Server]` - API requests and responses

### Testing Idempotency

1. Open Network tab in DevTools
2. Create a post while online
3. Find the POST request to `/api/posts`
4. Right-click → Copy → Copy as cURL
5. Paste in terminal and run multiple times
6. ✅ All requests should return 200 OK
7. ✅ Only one post is created (check backend logs)

### Simulating Slow Network

1. DevTools > Network tab
2. Change throttling to "Slow 3G"
3. Create posts
4. Watch them sync slowly

## 🎓 Next Steps

After you've tested the app:

1. **Explore the Code:**
   - Start with `src/App.tsx` - main application logic
   - Look at `src/utils/db.ts` - IndexedDB operations
   - Study `src/sw.ts` - Service Worker implementation
   - Check `server/index.js` - backend API

2. **Customize:**
   - Add more fields to posts (tags, images, etc.)
   - Implement delete functionality with sync
   - Add user authentication
   - Connect to a real database

3. **Deploy:**
   - Build for production: `npm run build`
   - Deploy frontend to Vercel/Netlify
   - Deploy backend to Railway/Heroku/AWS

---

Happy coding! 🚀
