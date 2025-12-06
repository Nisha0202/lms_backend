import express from 'express';
import { enrollStudent, getMyCourses } from '../controllers/enrollmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Enroll in a course (protected)
router.post('/enroll', protect, enrollStudent);

// Student dashboard: my courses
router.get('/my-courses', protect, getMyCourses);

export default router;
