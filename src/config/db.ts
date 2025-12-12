import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User as UserModel ,  IUser } from '../models/User'; // adjust path if needed

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) throw new Error('MONGO_URI is not defined in env');

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      // options are handled by mongoose default in v6+
    });
    console.log('MongoDB connected.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

/**
 * seedAdmin - create admin if not present
 * Uses ADMIN_EMAIL, ADMIN_PASSWORD from env
 */
export async function seedAdmin() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seeding.');
    return;
  }

  try {
    // Prefer checking by email, fallback to role check
    const existing = await UserModel.findOne({ email: ADMIN_EMAIL }).exec();

    if (existing) {
      // console.log('Admin already exists:', ADMIN_EMAIL);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const adminData: Partial<IUser> = {
      name: 'Administrator',
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'admin',
    };

    await UserModel.create(adminData);
    console.log('Admin user created:', ADMIN_EMAIL);
  } catch (err) {
    console.error('seedAdmin error:', err);
    throw err;
  }
}
