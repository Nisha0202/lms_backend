import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment';
import { Course, ICourse } from '../models/Course';
import { Lesson, ILesson } from '../models/Lesson';
import { QuizResult } from '../models/QuizResult';

// =======================
// Get Course Content
// =======================
// backend/controllers/learningController.ts

export async function getCourseContent(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    const { courseId } = req.params;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(courseId))
      return res.status(400).json({ message: 'Invalid courseId' });

    // 1. Get Enrollment (Don't populate batchId yet, it won't work for subdocs)
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });

    if (!enrollment) return res.status(403).json({ message: 'Not enrolled' });

    // 2. Fetch Course (We need this to find the batch AND return content)
    const course: any = await Course.findById(courseId).populate('lessons').exec();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // 3. Find the Batch manually from the Course's array
    // We use the batchId saved in the enrollment
    const batch = course.batches.find(
      (b: any) => b._id.toString() === enrollment.batchId.toString()
    );

    if (!batch) {
        // Edge case: Admin deleted the batch after student enrolled
        return res.status(404).json({ message: 'Batch data missing' });
    }

    // === 4. ENFORCE ACCESS WINDOW ===
    const now = new Date();

    // Scenario A: Too Early
    if (new Date(batch.startDate) > now) {
      return res.status(403).json({
        message: `Class hasn't started yet. Content unlocks on ${new Date(batch.startDate).toLocaleDateString()}`
      });
    }

    // Scenario B: Too Late (Expired)
    if (new Date(batch.endDate) < now) {
      return res.status(403).json({
        message: `Your access to this batch expired on ${new Date(batch.endDate).toLocaleDateString()}.`
      });
    }

    // 5. Success! Return content
    const completedLessons = enrollment.completedLessons.map((id: any) => id.toString());

    return res.json({
      course,
      completedLessons,
    });

  } catch (err) {
    console.error('getCourseContent error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}



export async function markLessonComplete(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    const { courseId, lessonId } = req.body;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid courseId or lessonId' });
    }

    // 1. Find Enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    // 🔥 FIX: Explicitly check if enrollment is null before using it
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // --- 2. Mark as Complete (If not already) ---
    // TypeScript now knows 'enrollment' is not null here
    if (!enrollment.completedLessons.some((l: any) => l.toString() === lessonId)) {
      enrollment.completedLessons.push(new mongoose.Types.ObjectId(lessonId));

      // Calculate Progress
      const course = await Course.findById(courseId);
      const totalLessons = course?.lessons.length || 0;

      if (totalLessons > 0) {
        enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
      }

      await enrollment.save();
    }

    // --- 3. Quiz Pending Result Logic ---
    const lesson = await Lesson.findById(lessonId);

    // Check if it's a quiz (either by type OR if it has a quiz link)
    if (lesson && (lesson.type === 'quiz' || lesson.quizFormUrl)) {
      await QuizResult.findOneAndUpdate(
        { student: studentId, lesson: lessonId },
        {
          student: studentId,
          lesson: lessonId
          // No 'score' set = Pending
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.json({
      message: 'Lesson complete',
      progress: enrollment.progress
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}