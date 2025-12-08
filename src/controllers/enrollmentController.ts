import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';

// =======================
// Enroll Student to Course
// =======================
export async function enrollStudent(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    const { courseId, batchId } = req.body as { courseId: string; batchId: string };

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    if (!courseId || !batchId) return res.status(400).json({ message: 'courseId and batchId are required' });

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: 'Invalid courseId or batchId' });
    }

    // 1️⃣ Check if already enrolled in this course
    const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existingEnrollment) return res.status(400).json({ message: 'Already enrolled in this course' });

    // 2️⃣ Check if batch exists and seats available
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const batch = course.batches.find((b: any) => b._id.toString() === batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const enrolledCount = await Enrollment.countDocuments({ course: courseId, batchId: batch._id });
    if (enrolledCount >= batch.seatLimit) {
      return res.status(400).json({ message: 'Batch is full' });
    }

    // 3️⃣ Create Enrollment (paymentStatus: pending)
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      batchId: batch._id,
      completedLessons: [],
      progress: 0,
      paymentStatus: 'pending',
    });

    // 4️⃣ Mock Payment: immediately mark as completed
    enrollment.paymentStatus = 'completed';
    await enrollment.save();

    return res.status(201).json({ message: 'Enrollment successful', enrollment });
  } catch (err) {
    console.error('enrollStudent error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Admin: Get ALL Enrollments
// =======================
export async function getAllEnrollments(req: Request, res: Response) {
  try {
    // 1. Fetch all enrollments, populate student and course details
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title batches') // We need batches to find the name
      .sort({ createdAt: -1 })
      .exec();

    // 2. Format the data for the frontend
    const formatted = enrollments.map((e) => {
      const course = e.course as any;
      const student = e.student as any;

      // Find the specific batch name from the course's batch list
      const batchDetails = course?.batches?.find(
        (b: any) => b._id.toString() === e.batchId.toString()
      );

      return {
        _id: e._id,
        studentName: student?.name || 'Unknown User',
        studentEmail: student?.email || 'No Email',
        courseTitle: course?.title || 'Unknown Course',
        batchName: batchDetails?.name || 'Unknown Batch', // <--- The magic lookup
        enrolledAt: e.createdAt,
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('getAllEnrollments error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


// =======================
// Admin: Get Dashboard Stats
// =======================
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // 1. Count Total Courses
    const totalCourses = await Course.countDocuments();

    // 2. Count Unique Students (using distinct)
    const uniqueStudents = (await Enrollment.distinct('student')).length;

    // 3. Count Total Enrollments (Revenue proxy)
    const totalEnrollments = await Enrollment.countDocuments();

    return res.json({
      totalCourses,
      totalStudents: uniqueStudents,
      totalEnrollments
    });
  } catch (err) {
    console.error('getDashboardStats error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Student Dashboard: My Courses
// =======================
export async function getMyCourses(req: Request, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'title description thumbnail price category tags batches', // <--- Request 'batches' so we can find the name
      })
      .exec();

    const formatted = enrollments.map((e) => {
      // Type assertion to access the populated course details
      const course = e.course as any; 
      
      // Find the specific batch name using the ID saved in enrollment
      const batchDetails = course.batches.find(
        (b: any) => b._id.toString() === e.batchId.toString()
      );

      return {
        _id: e._id,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          thumbnail: course.thumbnail, 
          price: course.price,
          // Don't send the whole batch list to frontend, just the info we need
        },
        batchName: batchDetails ? batchDetails.name : 'Unknown Batch', // <--- Critical UI fix
        startDate: batchDetails ? batchDetails.startDate : null,
        progress: e.progress,
        paymentStatus: e.paymentStatus,
        createdAt: e.createdAt,
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('getMyCourses error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}