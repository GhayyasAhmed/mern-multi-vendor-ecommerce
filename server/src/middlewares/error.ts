import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorhandler.js";
import { env } from "../config/env.js";

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    // console.log("err.statusCode", err.statusCode)
    // console.log("err.message", err.message)
    if(!err.message || !err.statusCode){
        console.log("error", err)
    }
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error"

    // mongodb cast error

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    // mongoose duplicate key error

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    // mongoose schema validation error (e.g. missing/invalid required fields)
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors as Record<string, { message: string }>)
            .map((val) => val.message)
            .join(", ")
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt token
    if (err.name === "JsonWebTokenError") {
        const message = `JSON web token is invalid, Try again`
        err = new ErrorHandler(message, 400)
    }

    // jwt token expire
    if (err.name === "TokenExpiredError") {
        const message = `JSON web token is expired, Try again`
        err = new ErrorHandler(message, 400)
    }

    const isOperational = err.isOperational === true;

    if (env.nodeEnv !== "production") {
        if (err.statusCode >= 500 || !isOperational) {
            console.error(
                `[${req.method}] ${req.originalUrl} ->`,
                err.stack || err.message
            );
        } else {
            console.warn(
                `[${req.method}] ${req.originalUrl} -> ${err.statusCode}: ${err.message}`
            );
        }
    }

    const responseMessage =
        !isOperational && err.statusCode >= 500
            ? "Something went wrong. Please try again later."
            : err.message;

    res.status(err.statusCode).json({
        success: false,
        message: responseMessage
    })
}

export default errorMiddleware