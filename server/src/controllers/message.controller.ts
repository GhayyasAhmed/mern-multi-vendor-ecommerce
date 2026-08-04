import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import MessageModel, { IMessageImage } from "../models/message.model.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// create new message
export const createNewMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { conversationId, text, sender, images: imageInput } = req.body;

      let imageData: IMessageImage | undefined = undefined;

      if (imageInput && typeof imageInput === "string") {
        const myCloud = await uploadToCloudinary(imageInput, "messages");
        imageData = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url || myCloud.url,
        };
      }

      const message = await MessageModel.create({
        conversationId,
        text,
        sender,
        images: imageData,
      });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// get all messages with conversation id
export const getAllMessages = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = req.params.id as string;

      const messages = await MessageModel.find({
        conversationId,
      });

      res.status(201).json({
        success: true,
        messages,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);