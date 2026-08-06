import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";

// Ensure Stripe Secret Key is defined
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-07-29.dahlia"
});

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
      metadata: {
        company: companyName,
      },
    });

    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
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