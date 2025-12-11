import { Request, Response } from 'express';
import { Course, ICourse, IBatch } from '../models/Course';
import { Lesson } from '../models/Lesson';
import mongoose from 'mongoose';

// =======================
// Create Course (Admin)
// =======================

export async function createCourse(req: Request, res: Response) {
  try {
    // 1. Destructure 'thumbnail' from body
    const { title, description, price, category, tags, batches, thumbnail } = req.body;

    if (!title || !category || price === undefined)
      return res.status(400).json({ message: 'title, category and price are required' });

    const course = await Course.create({
      title,
      thumbnail, 
      description,
      price,
      category,
      tags: tags || [],
      batches: batches || [],
      lessons: [],
      instructor: req.user?.id, 
    });

    return res.status(201).json(course);
  } catch (err) {
    console.error('createCourse error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Add Lesson to Course
// =======================
export async function addLessonToCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const { title, videoUrl, quizFormUrl, assignmentText } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'title and videoUrl are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = await Lesson.create({
      title,
      description: req.body.description, // Optional
      videoUrl,
      quizFormUrl,
      assignmentText,
    });

    // Push the lesson ID to the course
    course.lessons.push(lesson._id as any);
    await course.save();

    return res.status(201).json({ course, lesson });
  } catch (err) {
    console.error('addLessonToCourse error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// NEW: Add Batch to Existing Course
// =======================
export async function addBatchToCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const { name, startDate, endDate, seatLimit } = req.body;

    if (!name || !startDate || !endDate || !seatLimit) {
      return res.status(400).json({ message: 'All batch fields are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Push new batch to the array
    course.batches.push({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      seatLimit: Number(seatLimit),
    } as any); // Type assertion for Mongoose subdoc

    await course.save();

    return res.status(201).json(course);
  } catch (err) {
    console.error('addBatchToCourse error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Get Public Courses (With Sort & Populate)
// =======================
export async function getCourses(req: Request, res: Response) {
  try {
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');
    
    // Filtering
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const tags = (req.query.tags as string) || '';

    // Sorting (e.g. ?sort=price or ?sort=-price)
    const sortParam = (req.query.sort as string) || '-createdAt';

    const filter: any = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags.split(',') };

    const courses = await Course.find(filter)
      .populate('lessons')
      .select('-lessons -batches') // Keep list view lightweight
      .populate('instructor', 'name email') // Show instructor name, not just ID
      .sort(sortParam) // <--- APPLIED SORT HERE
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Course.countDocuments(filter);

    return res.json({ total, page, limit, courses });
  } catch (err) {
    console.error('getCourses error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =======================
// Get Single Course Details
// =======================
export async function getCourseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid course ID' });

    const course = await Course.findById(id)
      .populate('lessons') // Get full lesson details
      .populate('instructor', 'name email') // Get instructor details
      .exec();

    if (!course) return res.status(404).json({ message: 'Course not found' });

    return res.json(course);
  } catch (err) {
    console.error('getCourseById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}



export async function updateCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid course id" });

    const allowed = ["title","description","price","category","thumbnail","tags","batches"];
    const updateData: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    // Ensure batches (if passed) are in expected shape
    if (updateData.batches && !Array.isArray(updateData.batches)) {
      return res.status(400).json({ message: "batches should be an array" });
    }

    const updated = await Course.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) return res.status(404).json({ message: "Course not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updateCourse error", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid course id" });

    const deleted = await Course.findByIdAndDelete(id).exec();
    if (!deleted) return res.status(404).json({ message: "Course not found" });

    // Optional: cascade cleanup (lessons, enrollments) - implement if you want
    return res.json({ message: "Course deleted" });
  } catch (err) {
    console.error("deleteCourse error", err);
    return res.status(500).json({ message: "Server error" });
  }
}
