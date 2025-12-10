import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment';
import { Course, ICourse } from '../models/Course';
import { Lesson, ILesson } from '../models/Lesson';
import { QuizResult } from '../models/QuizResult';

// =======================
// Get Course Content
// =======================
export async function getCourseContent(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    const { courseId } = req.params;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(courseId))
      return res.status(400).json({ message: 'Invalid courseId' });

    // ✅ Check enrollment
    const enrollment: IEnrollment | null = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    // Fetch course with lessons
    const course: ICourse | null = await Course.findById(courseId).populate('lessons').exec();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Completed lessons
    const completedLessons = enrollment.completedLessons.map((id) => id.toString());

    return res.json({
      course,
      completedLessons,
    });
  } catch (err) {
    console.error('getCourseContent error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Mark Lesson Complete
// =======================
// export async function markLessonComplete(req: Request, res: Response) {
//   try {
//     const studentId = req.user?.id;
//     const { courseId, lessonId } = req.body as { courseId: string; lessonId: string };

//     if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
//     if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId))
//       return res.status(400).json({ message: 'Invalid courseId or lessonId' });

//     const enrollment: IEnrollment | null = await Enrollment.findOne({
//       student: studentId,
//       course: courseId,
//     });

//     if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

//     // Add lesson if not already completed
//     if (!enrollment.completedLessons.some((l) => l.toString() === lessonId)) {
//       enrollment.completedLessons.push(new mongoose.Types.ObjectId(lessonId));

//       // Recalculate progress
//       const course: ICourse | null = await Course.findById(courseId);
//       const totalLessons = course?.lessons.length || 0;
//       enrollment.progress = totalLessons
//         ? (enrollment.completedLessons.length / totalLessons) * 100
//         : 0;

//       await enrollment.save();
//     }

//     return res.json({ message: 'Lesson marked complete', progress: enrollment.progress });
//   } catch (err) {
//     console.error('markLessonComplete error', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }


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
    if (!enrollment.completedLessons.some((l:any) => l.toString() === lessonId)) {
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