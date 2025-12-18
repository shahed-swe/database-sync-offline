import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// Simple JSON-file-backed DB for development (no native modules)
const DB_FILE = join(__dirname, 'dev-db.json');

async function readDB() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { posts: [] };
    }
    throw err;
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Helpers
async function getAllPosts() {
  const db = await readDB();
  // newest first
  return (db.posts || []).slice().sort((a, b) => b.createdAt - a.createdAt);
}

async function getPostById(id) {
  const db = await readDB();
  return (db.posts || []).find((p) => p.id === id) || null;
}

async function insertPost(post) {
  const db = await readDB();
  db.posts = db.posts || [];
  const existing = db.posts.find((p) => p.id === post.id);
  if (existing) return { duplicate: true, post: existing };
  db.posts.push(post);
  await writeDB(db);
  return { duplicate: false, post };
}

async function deletePost(id) {
  const db = await readDB();
  const before = db.posts.length;
  db.posts = (db.posts || []).filter((p) => p.id !== id);
  await writeDB(db);
  return before !== db.posts.length;
}

async function clearPosts() {
  const db = await readDB();
  const count = (db.posts || []).length;
  db.posts = [];
  await writeDB(db);
  return count;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    console.error('[Server] GET /api/posts error', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { id, title, description, createdAt } = req.body || {};
    if (!id || !title || !description) return res.status(400).json({ error: 'id, title and description required' });
    const now = Date.now();
    const newPost = { id, title, description, createdAt: createdAt || now, syncedAt: now };
    const result = await insertPost(newPost);
    res.status(result.duplicate ? 200 : 201).json({ success: true, post: result.post, duplicate: result.duplicate });
  } catch (err) {
    console.error('[Server] POST /api/posts error', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) {
    console.error('[Server] GET /api/posts/:id error', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const ok = await deletePost(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Server] DELETE /api/posts/:id error', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.delete('/api/posts', async (req, res) => {
  try {
    const count = await clearPosts();
    res.json({ success: true, cleared: count });
  } catch (err) {
    console.error('[Server] DELETE /api/posts error', err);
    res.status(500).json({ error: 'Failed to clear posts' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Dev server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Posts:  http://localhost:${PORT}/api/posts`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
});

