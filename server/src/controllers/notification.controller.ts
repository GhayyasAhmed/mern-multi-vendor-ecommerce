import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import NotificationModel from "../models/notification.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

const getIdentity = (req: Request): { id: string; role: "user" | "seller" } | null => {
  if (req.user?._id) return { id: String(req.user._id), role: "user" };
  if (req.seller?._id) return { id: String(req.seller._id), role: "seller" };
  return null;
};

export const getMyNotifications = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = getIdentity(req);
    if (!identity) return next(new ErrorHandler("Please login to view notifications", 401));

    const { page, limit } = parsePagination(req.query, 20, 100);
    const filter = { recipientId: identity.id };

    const [notifications, totalItems, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ ...filter, read: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

export const markNotificationRead = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = getIdentity(req);
    if (!identity) return next(new ErrorHandler("Please login to update notifications", 401));

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, recipientId: identity.id },
      { $set: { read: true } },
      { returnDocument: 'after' }
    );

    if (!notification) return next(new ErrorHandler("Notification not found", 404));
    res.status(200).json({ success: true, notification });
  }
);

export const markAllNotificationsRead = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = getIdentity(req);
    if (!identity) return next(new ErrorHandler("Please login to update notifications", 401));

    await NotificationModel.updateMany({ recipientId: identity.id, read: false }, { $set: { read: true } });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  }
);