import { rateLimit } from "express-rate-limit";

// Higher ceiling limiter for read-only traffic (GET, HEAD, OPTIONS) to support live search and normal browsing
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10000,
    standardHeaders: true,
    legacyHeaders: false,
});

// Tighter limiter reserved for state-changing write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

// // General API limiter for backward compatibility
// export const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 600,
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// Stricter limiter for auth-sensitive routes (login, signup, activation)
// to slow down credential stuffing / brute-force / token-guessing attempts.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again later.",
    },
});