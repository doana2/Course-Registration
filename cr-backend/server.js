// server.js — Express app bootstrap
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // ✅ import the pool directly

const app = express();

// ---------- Middleware ----------
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json());

// Request logging (after body parsing)
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? { ...req.body, password: req.body.password ? '***' : undefined } : undefined,
    auth: req.headers.authorization ? 'Bearer ***' : 'none'
  });
  next();
});

// ---------- Database ----------
(async () => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    console.log('✅ Connected to MySQL database');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

// ---------- Routes ----------
const authRoutes = require('./auth.routes');
const enrollmentRoutes = require('./enrollment.routes');
const courseRoutes = require('./course.routes');
const instructorRoutes = require('./instructor.routes');

app.use('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/instructor', instructorRoutes);

// ---------- Start ----------
const PORT = process.env.PORT || 8085;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
