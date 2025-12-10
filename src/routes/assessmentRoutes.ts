import express from 'express';
import { 
  submitAssignment, 
  gradeAssignment, 
  getAdminQuizzes,
  updateQuizScore,
  getMyGrades, 
  getAdminSubmissions
} from '../controllers/assessmentController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// ======================
// Student Routes
// ======================
router.post('/submit-assignment', protect, submitAssignment);
router.get('/my-grades', protect, getMyGrades);

// ======================
// Admin Routes
// ======================
router.post('/grade-assignment/:submissionId', protect, adminOnly, gradeAssignment);

// Fix: correct controller
router.post('/record-quiz-score/:resultId', protect, adminOnly, updateQuizScore);

// Admin: View all quiz attempts
router.get('/admin/quizzes', protect, adminOnly, getAdminQuizzes);

// Fix: correct submissions inbox
router.get('/admin/submissions', protect, adminOnly, getAdminSubmissions);

export default router;
