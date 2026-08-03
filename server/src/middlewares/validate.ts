import { NextFunction, Request, Response } from "express";
import * as z from "zod";
import ErrorHandler from "../utils/errorhandler.js";

/**
 * Generic Zod validation middleware.
 * Validates { body, query, params } against the given schema and
 * replaces req.body with the parsed (typed/stripped) result.
 */
const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return next(new ErrorHandler(message || "Invalid request data", 400));
    }

    const parsed = result.data as { body?: unknown };
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }

    next();
  };

export default validate;