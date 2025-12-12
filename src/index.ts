import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, seedAdmin } from './config/db';
import authRoutes from '../src/routes/authRoutes';
import courseRoutes from '../src/routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import learningRoutes from './routes/learningRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",                // 1. Always allow Localhost
    process.env.FRONTEND_ORIGIN || ""       // 2. Allow Vercel (if set)
  ],
  credentials: true,
}));

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/learn', learningRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
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
