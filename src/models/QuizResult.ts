import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IQuizResult extends Document {
  student: Types.ObjectId;
  lesson: Types.ObjectId;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizResultSchema: Schema<IQuizResult> = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    score: { type: Number, min: 0, max: 100, required: true },
  },
  { timestamps: true }
);

export const QuizResult =
  mongoose.models.QuizResult || mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);