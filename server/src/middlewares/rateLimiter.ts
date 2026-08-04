import { rateLimit } from "express-rate-limit";

// General API limiter — applied globally to mitigate abuse/DoS.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth-sensitive routes (login, signup, activation)
// to slow down credential stuffing / brute-force / token-guessing attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});