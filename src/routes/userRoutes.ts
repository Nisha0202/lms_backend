import express from 'express';
import { getAllUsers, toggleUserBan } from '../controllers/userController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.patch('/:userId/ban', toggleUserBan);

export default router;