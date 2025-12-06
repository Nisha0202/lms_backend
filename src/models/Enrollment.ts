
import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  batchId: Types.ObjectId; // Ref to Course.batches._id
  completedLessons: Types.ObjectId[];
  progress: number;
  paymentStatus: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema: Schema<IEnrollment> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    batchId: { type: Schema.Types.ObjectId, required: true }, // points to Course.batches._id
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    progress: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  },
  { timestamps: true }
);

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);



