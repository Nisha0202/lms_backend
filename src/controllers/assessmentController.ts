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

    // 1. CHECK FIRST: Does a submission already exist?
    const existing = await AssignmentSubmission.findOne({ 
      student: studentId, 
      lesson: lessonId 
    });

    if (existing) {
      // 2. BLOCK IT: Return an error if they try again
      return res.status(400).json({ 
        message: 'You have already submitted this assignment. Resubmissions are not allowed.' 
      });
    }

    // 3. CREATE NEW: Only if it doesn't exist
    const submission = await AssignmentSubmission.create({
      student: studentId,
      lesson: lessonId,
      driveLink,
      // grade & feedback are undefined by default
    });

    return res.status(201).json(submission);

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
// Admin: Get All Quizzes (Inbox Style)
// =======================
export async function getAdminQuizzes(req: Request, res: Response) {
  try {
    const quizzes = await QuizResult.find()
      .populate('student', 'name email')
      .populate('lesson', 'title')
      .sort({ createdAt: -1 }) // Newest first
      .exec();

    return res.json(quizzes);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Admin: Grade Quiz (Updates the pending record)
// =======================
export async function updateQuizScore(req: Request, res: Response) {
  try {
    const { resultId, score, feedback } = req.body;

    const result = await QuizResult.findByIdAndUpdate(
      resultId,
      { score, feedback },
      { new: true }
    );

    return res.json(result);
  } catch (err) {
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

    // 1. Fetch Assignments
    const assignments = await AssignmentSubmission.find({ student: studentId })
      .populate('lesson', 'title') // Ensure Lesson model has 'title'
      .sort({ createdAt: -1 });

    // 2. Fetch Quizzes
    const quizzes = await QuizResult.find({ student: studentId })
      .populate('lesson', 'title')
      .sort({ createdAt: -1 });

    // DEBUG: Log what we found to the terminal
    console.log(`Found ${assignments.length} assignments and ${quizzes.length} quizzes`);

    return res.json({ assignments, quizzes });
  } catch (err) {
    console.error('getMyGrades error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


// =======================
// 5. Admin: Get All Submissions (The "Inbox")
// =======================
export async function getAdminSubmissions(req: Request, res: Response) {
  try {
    const { status } = req.query; // optional: ?status=pending

    const filter: any = {};
    if (status === 'pending') {
      filter.grade = { $exists: false }; // Only show ungraded work
    }

    const submissions = await AssignmentSubmission.find(filter)
      .populate('student', 'name email') // Show who sent it
      .populate('lesson', 'title')       // Show which task it was
      .sort({ createdAt: -1 })           // Newest first
      .exec();

    return res.json(submissions);
  } catch (err) {
    console.error('getAdminSubmissions error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}