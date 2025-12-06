import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AssignmentSubmission } from '../models/AssignmentSubmission'; // Check your path
import { QuizResult } from '../models/QuizResult'; // Check your path
import { Lesson } from '../models/Lesson';

// =======================
// 1. Student: Submit Assignment (Drive Link)
// =======================
export async function submitAssignment(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    const { lessonId, driveLink } = req.body;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    if (!lessonId || !driveLink) return res.status(400).json({ message: 'Missing fields' });

    // Update existing or create new submission (Upsert)
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { student: studentId, lesson: lessonId },
      { driveLink, grade: undefined, feedback: undefined }, // Reset grade if re-submitting
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(submission);
  } catch (err) {
    console.error('submitAssignment error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// 2. Admin: Grade Assignment
// =======================
export async function gradeAssignment(req: Request, res: Response) {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      { grade, feedback },
      { new: true }
    );

    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    return res.json(submission);
  } catch (err) {
    console.error('gradeAssignment error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// 3. Admin: Record Quiz Score (Manual Entry)
// =======================
export async function recordQuizScore(req: Request, res: Response) {
  try {
    const { studentId, lessonId, score } = req.body;

    if (!studentId || !lessonId || score === undefined) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Update existing or create new result
    const result = await QuizResult.findOneAndUpdate(
      { student: studentId, lesson: lessonId },
      { score },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(result);
  } catch (err) {
    console.error('recordQuizScore error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// 4. Student: Get My Gradebook (THE ANSWER TO YOUR QUESTION)
// =======================
export async function getMyGrades(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch Assignments
    const assignments = await AssignmentSubmission.find({ student: studentId })
      .populate('lesson', 'title')
      .exec();

    // Fetch Quizzes
    const quizzes = await QuizResult.find({ student: studentId })
      .populate('lesson', 'title')
      .exec();

    return res.json({ assignments, quizzes });
  } catch (err) {
    console.error('getMyGrades error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}