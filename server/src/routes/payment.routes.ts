import express from "express";
import {
  processPayment,
  getStripeApiKey,
  stripeWebhook,
} from "../controllers/payment.controller.js";
import { isAuthenticated } from "../middlewares/auth.js";

const paymentRouter = express.Router();

paymentRouter.post("/process", isAuthenticated, processPayment);
paymentRouter.get("/stripeapikey", getStripeApiKey);
paymentRouter.post("/webhook", stripeWebhook);

export default paymentRouter;