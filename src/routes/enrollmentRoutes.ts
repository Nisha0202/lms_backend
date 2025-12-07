import express from 'express';
import { enrollStudent, getAllEnrollments, getDashboardStats, getMyCourses } from '../controllers/enrollmentController';
import { adminOnly, protect } from '../middleware/authMiddleware';

const router = express.Router();

// Enroll in a course (protected)
router.post('/enroll', protect, enrollStudent);

// Student dashboard: my courses
router.get('/my-courses', protect, getMyCourses);
router.get('/admin/all-enroll', protect, adminOnly, getAllEnrollments);
router.get('/admin/stats', protect, adminOnly, getDashboardStats);
export default router;
