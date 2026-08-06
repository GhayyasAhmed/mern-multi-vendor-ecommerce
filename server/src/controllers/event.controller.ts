import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import EventModel, { IEvent } from "../models/event.model.js";
import ShopModel from "../models/shop.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

type DecoratedEvent = Record<string, unknown> & {
  isActive: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
};

const decorateEvent = (event: IEvent): DecoratedEvent => {
  const now = Date.now();
  const start = new Date(event.start_Date).getTime();
  const finish = new Date(event.Finish_Date).getTime();

  const isUpcoming = start > now;
  const isExpired = finish < now;
  const isActive = !isUpcoming && !isExpired;

  const plain =
    typeof (event as unknown as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (event as unknown as { toObject: () => Record<string, unknown> }).toObject()
      : (event as unknown as Record<string, unknown>);

  return { ...plain, isActive, isUpcoming, isExpired };
};

// create event --- always scoped to the authenticated seller's own shop
export const createEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const imagesLinks: Array<{ public_id: string; url: string }> = [];
    try {
      const sellerId = req.seller?._id;

      if (!sellerId) {
        return next(new ErrorHandler("Seller not found in request", 400));
      }

      const shop = await ShopModel.findById(sellerId);

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      let images: string[] = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
      }

      const validImages = images.filter((img): img is string => Boolean(img));

      const uploadResults = await Promise.allSettled(
        validImages.map((image) => uploadToCloudinary(image, "products"))
      );

      const failedUpload = uploadResults.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (failedUpload) {
        const uploaded = uploadResults.filter(
          (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadToCloudinary>>> =>
            result.status === "fulfilled"
        );
        await Promise.all(uploaded.map((res) => deleteFromCloudinary(res.value.public_id)));
        throw failedUpload.reason;
      }

      for (const result of uploadResults) {
        if (result.status === "fulfilled") {
          imagesLinks.push({
            public_id: result.value.public_id,
            url: result.value.secure_url,
          });
        }
      }

      const productData = req.body;
      productData.images = imagesLinks;
      productData.shop = shop;
      productData.shopId = String(sellerId);

      const event = await EventModel.create(productData);

      res.status(201).json({
        success: true,
        event: decorateEvent(event),
      });
    } catch (error: unknown) {
      if (imagesLinks.length > 0) {
        await Promise.all(
          imagesLinks.map((img) => deleteFromCloudinary(img.public_id))
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all events (public) — optional ?status=active|upcoming|expired and ?limit=
export const getAllEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const limit = rawLimit ? Math.min(Math.max(rawLimit, 1), 50) : undefined;

      const events = await EventModel.find().sort({ createdAt: -1 });
      let decorated = events.map(decorateEvent);

      if (statusFilter === "active") decorated = decorated.filter((e) => e.isActive);
      else if (statusFilter === "upcoming") decorated = decorated.filter((e) => e.isUpcoming);
      else if (statusFilter === "expired") decorated = decorated.filter((e) => e.isExpired);

      if (limit) decorated = decorated.slice(0, limit);

      res.status(200).json({
        success: true,
        events: decorated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get single event by id
export const getEventById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await EventModel.findById(req.params.id);

    if (!event) {
      return next(new ErrorHandler("Event not found with this id", 404));
    }

    res.status(200).json({
      success: true,
      event: decorateEvent(event),
    });
  }
);

// get all events of a shop
export const getShopAllEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await EventModel.find({ shopId: req.params.id }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        events: events.map(decorateEvent),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// delete event of a shop --- only the owning seller may delete
export const deleteShopEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await EventModel.findById(req.params.id);

      if (!event) {
        return next(new ErrorHandler("Event is not found with this id", 404));
      }

      if (String(event.shopId) !== String(req.seller?._id)) {
        return next(new ErrorHandler("You are not authorized to delete this event", 403));
      }

      const images = event.images || [];
      const deletePromises = images
        .map((img) => img?.public_id)
        .filter((publicId): publicId is string => Boolean(publicId))
        .map((publicId) => deleteFromCloudinary(publicId));

      await Promise.all(deletePromises);

      await EventModel.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Event Deleted successfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// all events --- for admin
export const getAdminAllEvents = catchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await EventModel.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        events: events.map(decorateEvent),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);