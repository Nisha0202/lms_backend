import express from 'express';
import {
  createCourse,
  addLessonToCourse,
  addBatchToCourse, // <--- Import this
  getCourses,
  getCourseById,
} from '../controllers/courseController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Admin Routes
router.post('/', protect, adminOnly, createCourse);
router.post('/:courseId/lessons', protect, adminOnly, addLessonToCourse);
router.post('/:courseId/batches', protect, adminOnly, addBatchToCourse); // <--- New Route

// Public Routes
router.get('/', getCourses);
router.get('/:id', getCourseById);

export default router;