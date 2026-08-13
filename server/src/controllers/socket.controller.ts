import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import { createSocketTicket } from "../utils/socketTicket.js";

export const issueSocketTicket = catchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.user) {
            const ticket = await createSocketTicket({
                role: req.user.role === "admin" ? "admin" : "user",
                id: String(req.user._id),
                name: req.user.name,
                avatar: req.user.avatar?.url,
            });
            res.status(200).json({ success: true, ticket });
            return;
        }

        if (req.seller) {
            const ticket = await createSocketTicket({
                role: "seller",
                id: String(req.seller._id),
                name: req.seller.name,
                avatar: req.seller.avatar?.url,
            });
            res.status(200).json({ success: true, ticket });
            return;
        }

        return next(new ErrorHandler("Please login to access this resource", 401));
    }
);