import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';


// SAFE FACTORY
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
};

// ===============================
// CREATE CHECKOUT SESSION
// ===============================
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { courseId, batchId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const stripe = getStripe();

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Prevent duplicate enrollment
    const already = await Enrollment.findOne({ student: userId, course: courseId });
    if (already) return res.status(400).json({ message: "Already enrolled" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: { name: course.title },
            unit_amount: course.price * 100,
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      metadata: {
        userId,
        courseId,
        batchId,
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/courses/${courseId}`,
    });

    return res.json({ url: session.url });

  } catch (err: any) {
    console.error("Checkout Error:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ===============================
// VERIFY PAYMENT SESSION
// ===============================
export async function verifyPaymentSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const { userId, courseId, batchId } = session.metadata || {};

    if (!userId || !courseId || !batchId) {
      return res.status(400).json({ message: "Missing metadata" });
    }

    // Avoid duplicate enrollments
    const exists = await Enrollment.findOne({ student: userId, course: courseId });
    if (exists) return res.json({ message: "Already enrolled", enrollment: exists });

    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      batchId,
      paymentStatus: "completed",
      progress: 0,
      completedLessons: [],
    });

    return res.json({
      message: "Enrollment successful",
      enrollment,
    });

  } catch (err: any) {
    console.error("Verify Error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}
