import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    const token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized.' });

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // attach typed user to req
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    console.error('protect middleware error', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
}