import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, seedAdmin } from './config/db';
import authRoutes from '../src/routes/authRoutes';
import courseRoutes from '../src/routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import learningRoutes from './routes/learningRoutes';
dotenv.config();

const app = express();

// CORS — allow your Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/learn', learningRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    await seedAdmin(); // ensure admin seeded
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
