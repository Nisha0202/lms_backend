import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User as UserModel } from '../models/User';

const JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { 
    // Cast the variable to 'any' or 'string' to satisfy the compiler
    expiresIn: JWT_EXPIRES_IN as any 
  });
}
function sanitizeUser(user: any) {
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  return u;
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });

    const existing = await UserModel.findOne({ email }).exec();
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashed,
      role: 'student',
    });

    const token = signToken({ userId: user._id, role: user.role });

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('registerUser error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'email & password required' });

    const user = await UserModel.findOne({ email }).exec();
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });
    
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    const token = signToken({ userId: user._id, role: user.role });

    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('loginUser error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
