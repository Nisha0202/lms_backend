import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IAssignmentSubmission extends Document {
  student: Types.ObjectId;
  lesson: Types.ObjectId;
  driveLink: string;
  grade?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema: Schema<IAssignmentSubmission> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    driveLink: { type: String, required: true },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
  },
  { timestamps: true }
);

export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);