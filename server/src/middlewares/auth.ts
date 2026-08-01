import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redis.js";
import ErrorHandler from "../utils/errorhandler.js";
import CatchAsyncError from "./catchAsyncError.js";


export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        return next()
    }
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1]
    if(!accessToken){
        return next(new ErrorHandler("Please login to access this resource", 401))
    }

    const decodedData = jwt.verify(accessToken, process.env.ACCESS_TOKEN || "") as JwtPayload
    
    if(!decodedData){
        return next(new ErrorHandler("Invalid access token", 401))
    }

    const user = await redis.get(decodedData.id)
    // const user = await UserModel.findById(decodedData.id)

    if(!user){
        return next(new ErrorHandler("Session expired. Please login again", 401))
    }

    req.user = JSON.parse(user)
    next()

})

// const isSeller = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//     const sellerToken = req.cookies.sellerToken;
//     if(!sellerToken){
//         return next(new ErrorHandler("Please login to continue", 401));
//     }

//     const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY || "");

//     req.seller = await Shop.findById(decoded.id);

//     next();
// })


export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            // Stop processing immediately: do not fall through to next().
            // Previously this branch called next(err) and then execution
            // continued to an unconditional next() below, which advanced
            // Express to the protected route handler regardless of role.
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource`, 403));
        }
        return next();
    }
}