import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBatch {
  _id: Types.ObjectId; // Explicitly defined
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
    title: { type: String, required: true, index: true }, // Index for Search
    description: { type: String },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson', required: true }],
    batches: [BatchSchema],
    price: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, index: true }, // Index for Filter
    tags: { type: [String], default: [], index: true },      // Index for Filter
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);