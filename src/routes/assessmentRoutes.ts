import express from 'express';
import { 
  submitAssignment, 
  gradeAssignment, 
  recordQuizScore, 
  getMyGrades 
} from '../controllers/assessmentController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Student Routes
router.post('/submit-assignment', protect, submitAssignment);
router.get('/my-grades', protect, getMyGrades); // <--- This is how they see marks

// Admin Routes
router.post('/grade-assignment/:submissionId', protect, adminOnly, gradeAssignment);
router.post('/record-quiz-score', protect, adminOnly, recordQuizScore);

export default router;