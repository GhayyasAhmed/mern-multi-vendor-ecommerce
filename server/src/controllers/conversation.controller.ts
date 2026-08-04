import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import ConversationModel from "../models/conversation.model.js";

// create a new conversation
export const createNewConversation = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupTitle, userId, sellerId } = req.body;

      const isConversationExist = await ConversationModel.findOne({ groupTitle });

      if (isConversationExist) {
        res.status(201).json({
          success: true,
          conversation: isConversationExist,
        });
      } else {
        const conversation = await ConversationModel.create({
          members: [userId, sellerId],
          groupTitle,
        });

        res.status(201).json({
          success: true,
          conversation,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// get seller conversations
export const getSellerAllConversations = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = req.params.id as string;

      const conversations = await ConversationModel.find({
        members: {
          $in: [sellerId],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// get user conversations
export const getUserAllConversations = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.id as string;

      const conversations = await ConversationModel.find({
        members: {
          $in: [userId],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// update the last message
export const updateLastMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lastMessage, lastMessageId } = req.body;
      const conversationId = req.params.id as string;

      const conversation = await ConversationModel.findByIdAndUpdate(
        conversationId,
        {
          lastMessage,
          lastMessageId,
        },
        { new: true }
      );

      if (!conversation) {
        return next(new ErrorHandler("Conversation not found with this id", 404));
      }

      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);