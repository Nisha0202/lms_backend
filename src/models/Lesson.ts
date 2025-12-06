import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  title: string;
  description?: string;
  videoUrl: string;       // YouTube Video
  quizFormUrl?: string;   // Google Form Quiz link (Optional)
  assignmentText?: string;// Assignment instructions (Optional)
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema: Schema<ILesson> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    quizFormUrl: { type: String },    // Removed required: true
    assignmentText: { type: String }, // Removed required: true
  },
  { timestamps: true }
);

export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson>("Lesson", LessonSchema);