import Stripe from "stripe";

// Single shared Stripe client for the whole server (payment intents,
// webhook signature verification, and order-creation verification all
// reuse this instance instead of each constructing their own).
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-07-29.dahlia",
});