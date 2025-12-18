# 🎯 Complete Installation & Testing Guide

## 📦 Installation

Run this command in your terminal:

```bash
cd /Users/k53/Desktop/offline-app-poc && npm install
```

This will install all dependencies (~2-3 minutes on first run).

## 🚀 Running the Application

### Option 1: Two Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/k53/Desktop/offline-app-poc
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd /Users/k53/Desktop/offline-app-poc
npm run dev
```

### Option 2: Background Process

**Terminal 1:**
```bash
cd /Users/k53/Desktop/offline-app-poc
npm run server &
npm run dev
```

## ✅ Verification Checklist

### Step 1: Backend Running ✓
```
After running `npm run server`, you should see:

╔════════════════════════════════════════════════╗
║  🚀 Offline-First Backend Server Running      ║
║  Port: 3001                                    ║
╚════════════════════════════════════════════════╝
```

### Step 2: Frontend Running ✓
```
After running `npm run dev`, you should see:

VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser ✓
Navigate to: **http://localhost:5173**

You should see:
- 📱 Header: "Offline-First App"
- 🟢 Green banner: "Online"
- 📝 Form: Title and Description inputs
- 📋 Empty post list

### Step 4: Create First Post (Online) ✓
1. Enter Title: "My First Post"
2. Enter Description: "This works online!"
3. Click "Create Post"
4. ✅ Post appears with "✓ Synced" badge

### Step 5: Test Offline Mode ✓

**Enable Offline Mode:**
1. Press `F12` (DevTools)
2. Click "Network" tab
3. Change dropdown: "No throttling" → **"Offline"**
4. Banner turns 🔴 Red: "Offline - Changes will sync..."

**Create Offline Post:**
1. Title: "Offline Post"
2. Description: "Created without internet"
3. Click "Create Post"
4. ✅ Post appears with "⏳ Pending" badge

### Step 6: Test Auto-Sync ✓
1. In DevTools Network tab: Change "Offline" → **"No throttling"**
2. Watch the magic:
   - ✅ Banner turns 🟢 Green
   - ✅ "⏳ Pending" changes to "✓ Synced"
   - ✅ Console shows sync logs

### Step 7: Test Persistence ✓
1. Create posts offline
2. **Refresh page (F5)**
3. ✅ All posts still visible
4. Go online
5. ✅ Auto-sync happens

### Step 8: Test Tab Close/Reopen ✓
1. Create posts offline
2. **Close browser tab**
3. **Reopen:** http://localhost:5173
4. ✅ Posts preserved
5. ✅ Auto-sync if online

## 🔍 Inspect Developer Tools

### View IndexedDB
1. DevTools (`F12`)
2. **Application** tab
3. Left sidebar: **IndexedDB** → **OfflineFirstDB** → **posts**
4. See all posts with sync status

### View Service Worker
1. DevTools (`F12`)
2. **Application** tab
3. Left sidebar: **Service Workers**
4. See: Active service worker
5. Options:
   - ☑️ Offline checkbox (simulates offline)
   - 🔄 Update (forces reload)
   - ❌ Unregister (removes SW)

### Console Logs
Check console for detailed logs:
- `[App]` - Application events
- `[DB]` - Database operations
- `[API]` - Network requests
- `[Sync]` - Sync process
- `[SW]` - Service Worker

## 🧪 Advanced Testing

### Test Idempotency

1. Create a post while online
2. Open DevTools → Network tab
3. Find POST request to `/api/posts`
4. Right-click → Copy → **Copy as cURL**
5. Paste in terminal and run 3 times
6. ✅ All return success
7. ✅ Only ONE post in database

Example:
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"id":"test-123","title":"Test","description":"Testing"}'
```

### Test Background Sync Retry

1. Create posts offline
2. Stop backend: `Ctrl+C` in server terminal
3. Go online (DevTools: "No throttling")
4. ✅ Sync attempts, fails, retries
5. Restart backend: `npm run server`
6. ✅ Sync succeeds automatically

### Test Network Flakiness

1. DevTools → Network → Select **"Slow 3G"**
2. Create multiple posts
3. Watch them sync slowly one by one

## 📊 Backend API Testing

### Health Check
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":...}
```

### Get All Posts
```bash
curl http://localhost:3001/api/posts
# Expected: Array of posts
```

### Create Post
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Test Post",
    "description": "Created via cURL",
    "createdAt": 1703001234567
  }'
```

### Test Idempotency (Run Twice)
```bash
# Run this command twice
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"id":"same-id-123","title":"Same","description":"Same"}'

# First time: 201 Created
# Second time: 200 OK (duplicate: true)
```

## 🐛 Troubleshooting Guide

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "Port 3001 already in use"
**Solution:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
# Then restart server
npm run server
```

### Problem: "Port 5173 already in use"
**Solution:**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Then restart frontend
npm run dev
```

### Problem: Service Worker not updating
**Solution:**
```bash
# 1. Hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 2. Unregister SW
DevTools → Application → Service Workers → Unregister

# 3. Clear storage
DevTools → Application → Clear storage → Clear site data
```

### Problem: Posts not syncing
**Check:**
1. ✅ Backend running? Check terminal
2. ✅ Network online? Check banner
3. ✅ Console errors? Check DevTools
4. ✅ Service Worker active? Check Application tab

### Problem: IndexedDB not working
**Solution:**
```bash
# Clear IndexedDB
DevTools → Application → IndexedDB → 
Right-click "OfflineFirstDB" → Delete database
```

## 📱 Browser Compatibility

**Recommended:**
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

**Note:** Background Sync not available in:
- ❌ Private/Incognito mode (most browsers)
- ❌ Safari (limited support)
- ✅ Chrome/Edge (full support)

## 🎓 What to Look At

### For Beginners
1. Start with `src/App.tsx` - main logic
2. Look at `src/components/PostForm.tsx` - form handling
3. Check `src/utils/db.ts` - database operations

### For Intermediate
1. Study `src/sw.ts` - Service Worker
2. Analyze `src/utils/sync.ts` - sync logic
3. Review `server/index.js` - backend API

### For Advanced
1. Optimize sync strategies
2. Add error recovery
3. Implement conflict resolution
4. Add offline indicators per post
5. Build retry queue with exponential backoff

## 📚 Next Steps

After testing:

1. **Read the code** - Everything is commented
2. **Modify and experiment** - Break things, learn!
3. **Build features** - Add your own ideas
4. **Deploy** - Make it production-ready

## 🎯 Success Criteria

You've successfully completed testing when:

- ✅ Created posts online → immediately synced
- ✅ Created posts offline → saved locally
- ✅ Went online → auto-synced
- ✅ Refreshed → data persisted
- ✅ Closed tab → reopened → data still there
- ✅ Checked IndexedDB → saw stored posts
- ✅ Checked Service Worker → saw it active
- ✅ Tested idempotency → duplicates handled
- ✅ Read console logs → understood flow
- ✅ Explored code → learned patterns

## 🚀 You're Ready!

Everything is set up and ready to use. The application is:

- ✅ Fully functional
- ✅ Production-ready architecture
- ✅ Well-documented
- ✅ Type-safe (TypeScript)
- ✅ Following best practices

**Happy coding! 🎉**

---

Questions? Check:
- `README.md` - Full documentation
- `ARCHITECTURE.md` - Technical deep dive
- `PROJECT_SUMMARY.md` - Overview

All files have extensive comments explaining how everything works!
