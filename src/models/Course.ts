import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBatch {
  _id: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  seatLimit: number;
}

const BatchSchema: Schema<IBatch> = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  seatLimit: { type: Number, required: true },
});

export interface ICourse extends Document {
  title: string;
  thumbnail?: string; // <--- ADDED THIS
  description?: string;
  lessons: Types.ObjectId[];
  batches: IBatch[];
  price: number;
  category: string;
  tags: string[];
  instructor: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema<ICourse> = new Schema(
  {
    title: { type: String, required: true, index: true },
    // 1. Add the Thumbnail Field
    thumbnail: { 
      type: String, 
      required: false, 
      default: 'https://i.pinimg.com/736x/18/a7/56/18a75698cd60256639c419293c7cb62c.jpg' // Fallback image
    },
    description: { type: String },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson', required: true }],
    batches: [BatchSchema],
    price: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);