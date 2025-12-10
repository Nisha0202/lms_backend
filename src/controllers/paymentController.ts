import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';

// 1. Remove the global 'const stripe = ...' line that causes the crash.

// 2. Helper to get Stripe instance safely
const getStripe = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is missing in .env file");
  }
  return new Stripe(apiKey, {
    apiVersion: '2023-10-16' as any, // Cast to any to avoid version mismatch errors
  });
};

// ==========================================
// Create Checkout Session
// ==========================================

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { courseId, batchId } = req.body;
    const userId = req.user?.id;

    const stripe = getStripe();

    // 1. Validate Course Exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // 🔥 FIX: Check if already enrolled BEFORE creating a session
    const existingEnrollment = await Enrollment.findOne({ 
      student: userId, 
      course: courseId 
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // 2. Create Stripe Session (Only runs if not enrolled)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bdt', 
            product_data: {
              name: course.title,
              description: `Batch enrollment for ${course.title}`,
            },
            unit_amount: course.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId: userId as string,
        courseId: courseId,
        batchId: batchId,
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/courses/${courseId}`,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Error:", error.message);
    return res.status(500).json({ message: 'Payment Error: ' + error.message });
  }
}

// ==========================================
// Verify Payment Session
// ==========================================
export async function verifyPaymentSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;
    
    // 3. Initialize Stripe HERE as well
    const stripe = getStripe();

    if (!sessionId) return res.status(400).json({ message: 'Missing session ID' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const { userId, courseId, batchId } = session.metadata as any;

    if (!userId || !courseId || !batchId) {
      return res.status(400).json({ message: 'Invalid session metadata' });
    }

    const existing = await Enrollment.findOne({ student: userId, course: courseId });
    if (existing) {
      return res.json({ message: 'Already enrolled', enrollment: existing });
    }

    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      batchId: batchId,
      paymentStatus: 'completed',
      progress: 0,
      completedLessons: []
    });

    return res.json({ message: 'Enrollment successful', enrollment });

  } catch (error: any) {
    console.error("Verify Error:", error.message);
    return res.status(500).json({ message: 'Verification failed' });
  }
}