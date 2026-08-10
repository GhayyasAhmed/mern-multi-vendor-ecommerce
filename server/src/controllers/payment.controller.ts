import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import { stripe } from "../config/stripe.js";
import OrderModel from "../models/order.model.js";
interface ProcessPaymentBody {
  amount: number;
  currency?: string;
}

export const processPayment = catchAsyncErrors(
  async (
    req: Request<{}, {}, ProcessPaymentBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { amount, currency } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return next(
        new ErrorHandler("Please provide a valid payment amount.", 400)
      );
    }

    const paymentCurrency =
      currency || process.env.STRIPE_CURRENCY || "usd";
    const companyName = process.env.COMPANY_NAME || "mern-multi-vendor-ecommerce";

    const myPayment = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer representing smallest currency unit
      currency: paymentCurrency.toLowerCase(),
      // automatic_payment_methods: { enabled: false },
      payment_method_types: ["card"],
      metadata: {
        company: companyName,
      },
    });

    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
      paymentIntentId: myPayment.id,
    });
  }
);

export const getStripeApiKey = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stripeApiKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!stripeApiKey) {
      return next(
        new ErrorHandler(
          "Stripe API Key is not configured on the server.",
          500
        )
      );
    }

    res.status(200).json({
      stripeApikey: stripeApiKey,
    });
  }
);


export const stripeWebhook = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return next(new ErrorHandler("Stripe webhook secret is not configured on the server.", 500));
    }

    if (!signature || Array.isArray(signature)) {
      return next(new ErrorHandler("Missing or invalid Stripe signature header.", 400));
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      return next(
        new ErrorHandler(`Webhook signature verification failed: ${(error as Error).message}`, 400)
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await OrderModel.updateMany(
        { "paymentInfo.id": paymentIntent.id },
        { $set: { "paymentInfo.status": "Succeeded", paidAt: new Date() } }
      );
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await OrderModel.updateMany(
        { "paymentInfo.id": paymentIntent.id },
        { $set: { "paymentInfo.status": "Failed" } }
      );
    }

    res.status(200).json({ received: true });
  }
);