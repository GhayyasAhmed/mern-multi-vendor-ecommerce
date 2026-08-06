import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import ErrorHandler from "../utils/errorhandler.js";
import CatchAsyncError from "./catchAsyncError.js";

export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        return next();
    }
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decodedData = jwt.verify(accessToken, env.accessTokenSecret) as JwtPayload;
    
    if (!decodedData) {
        return next(new ErrorHandler("Invalid access token", 401));
    }

    const user = await redis.get(decodedData.id);

    if (!user) {
        return next(new ErrorHandler("Session expired. Please login again", 401));
    }

    req.user = JSON.parse(user);
    next();
});

export const isSeller = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (req.seller) {
        return next();
    }
    const sellerToken = req.cookies.seller_token || req.headers.authorization?.split(" ")[1];

    if (!sellerToken) {
        return next(new ErrorHandler("Please login to access this shop resource", 401));
    }

    const decodedData = jwt.verify(sellerToken, env.jwtSecretKey) as JwtPayload;

    if (!decodedData) {
        return next(new ErrorHandler("Invalid shop token", 401));
    }

    // Checking Redis session (falls back to stringified shop session if cached)
    const seller = await redis.get(`seller_${decodedData.id}`);

    if (!seller) {
        return next(new ErrorHandler("Shop session expired. Please login again", 401));
    }

    req.seller = JSON.parse(seller);
    next();
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource`, 403));
        }
        return next();
    };
};


export const attachIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (accessToken) {
            const decoded = jwt.verify(accessToken, env.accessTokenSecret) as JwtPayload;
            const userRaw = await redis.get(decoded.id);
            if (userRaw) {
                req.user = JSON.parse(userRaw);
            }
        }
    } catch {
        // invalid/expired user token — ignore, ownership check downstream will reject
    }

    try {
        const sellerToken = req.cookies.seller_token;
        if (sellerToken) {
            const decoded = jwt.verify(sellerToken, env.jwtSecretKey) as JwtPayload;
            const sellerRaw = await redis.get(`seller_${decoded.id}`);
            if (sellerRaw) {
                req.seller = JSON.parse(sellerRaw);
            }
        }
    } catch {
        // invalid/expired seller token — ignore
    }

    if (!req.user && !req.seller) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    next();
};