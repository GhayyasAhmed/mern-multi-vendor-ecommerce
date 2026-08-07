import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import EventModel, { IEvent } from "../models/event.model.js";
import ShopModel from "../models/shop.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js"


type DecoratedEvent = Record<string, unknown> & {
  isActive: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
};

const decorateEvent = (event: IEvent): DecoratedEvent => {
  const now = Date.now();
  const start = event?.start_Date ? new Date(event.start_Date).getTime() : 0;
  const finish = event?.Finish_Date ? new Date(event.Finish_Date).getTime() : 0;

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
      validImages.map((image) => uploadToCloudinary(image, "events"))
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

    const imagesLinks: Array<{ public_id: string; url: string }> = [];

    for (const result of uploadResults) {
      if (result.status === "fulfilled") {
        imagesLinks.push({
          public_id: result.value.public_id,
          url: result.value.secure_url,
        });
      }
    }

    const eventData = req.body;
    eventData.images = imagesLinks;
    eventData.shop = shop;
    eventData.shopId = String(sellerId);

    // Targeted compensating cleanup: if database insertion fails, remove uploaded Cloudinary images first
    try {
      const event = await EventModel.create(eventData);

      res.status(201).json({
        success: true,
        event: decorateEvent(event),
      });
    } catch (error) {
      if (imagesLinks.length > 0) {
        await Promise.all(
          imagesLinks.map((img) => deleteFromCloudinary(img.public_id))
        );
      }
      throw error;
    }
  }
);

// get all events (public) — optional ?status=active|upcoming|expired and ?limit=
export const getAllEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const statusFilter = req.query.status as string | undefined;
    const { page, limit } = parsePagination(req.query, 12, 50);
    const now = new Date();

    const filter: Record<string, any> = {};
    if (statusFilter === "active") {
      filter.start_Date = { $lte: now };
      filter.Finish_Date = { $gte: now };
    } else if (statusFilter === "upcoming") {
      filter.start_Date = { $gt: now };
    } else if (statusFilter === "expired") {
      filter.Finish_Date = { $lt: now };
    }

    const [events, totalItems] = await Promise.all([
      EventModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      EventModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      events: events.map(decorateEvent),
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
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
    const { page, limit } = parsePagination(req.query, 12, 50);
    const filter = { shopId: req.params.id };

    const [events, totalItems] = await Promise.all([
      EventModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      EventModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      events: events.map(decorateEvent),
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// delete event of a shop --- only the owning seller may delete
export const deleteShopEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  }
);

// all events --- for admin
export const getAdminAllEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page, limit } = parsePagination(req.query, 20, 100);

    const [events, totalItems] = await Promise.all([
      EventModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      EventModel.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      events: events.map(decorateEvent),
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);
