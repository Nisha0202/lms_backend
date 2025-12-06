import express from 'express';
import { getCourseContent, markLessonComplete } from '../controllers/learningController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protected Routes
router.get('/course/:courseId', protect, getCourseContent);
router.post('/complete', protect, markLessonComplete);

export default router;
