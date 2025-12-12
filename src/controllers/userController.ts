import { Request, Response } from 'express';
import { User } from '../models/User';

// 1. Get All Users (Except Admins)
export async function getAllUsers(req: Request, res: Response) {
  try {
    // Fetch all users where role is NOT admin
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// 2. Toggle Ban Status
export async function toggleUserBan(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent banning other admins (security safeguard)
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban an admin' });
    }

    // Toggle the status
    user.isBanned = !user.isBanned;
    await user.save();

    return res.json({ 
      message: user.isBanned ? 'User has been banned' : 'User access restored',
      user 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}