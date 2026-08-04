import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import EventModel from "../models/event.model.js";
import ShopModel from "../models/shop.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// create event
export const createEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.body.shopId;
      const shop = await ShopModel.findById(shopId);

      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      }

      let images: string[] = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
      }

      const imagesLinks: Array<{ public_id: string; url: string }> = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image) continue;

        const result = await uploadToCloudinary(image, "products");

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      const productData = req.body;
      productData.images = imagesLinks;
      productData.shop = shop;

      const event = await EventModel.create(productData);

      res.status(201).json({
        success: true,
        event,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all events
export const getAllEvents = catchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await EventModel.find();
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all events of a shop
export const getShopAllEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await EventModel.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        events,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// delete event of a shop
export const deleteShopEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await EventModel.findById(req.params.id);

      if (!event) {
        return next(new ErrorHandler("Event is not found with this id", 404));
      }

      const images = event.images || [];
      for (let i = 0; i < images.length; i++) {
        const publicId = images[i]?.public_id;
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }

      await EventModel.findByIdAndDelete(req.params.id);

      res.status(201).json({
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

      res.status(201).json({
        success: true,
        events,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);