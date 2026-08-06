import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import MessageModel, { IMessageImage } from "../models/message.model.js";
import ConversationModel from "../models/conversation.model.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const getIdentityId = (req: Request): string | undefined => {
  if (req.user?._id) return String(req.user._id);
  if (req.seller?._id) return String(req.seller._id);
  return undefined;
};

// create new message --- sender is always the authenticated identity, never
// a client-supplied value
export const createNewMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identityId = getIdentityId(req);

    if (!identityId) {
      return next(new ErrorHandler("Please login to send messages", 401));
    }

    const { conversationId, text, images: imageInput } = req.body;

    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return next(new ErrorHandler("Conversation not found", 404));
    }

    const memberIds = conversation.members.map(String);

    if (!memberIds.includes(identityId)) {
      return next(new ErrorHandler("You are not a participant of this conversation", 403));
    }

    if (!text?.trim() && !imageInput) {
      return next(new ErrorHandler("Message must contain text or an image", 400));
    }

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
      sender: identityId,
      images: imageData,
    });

    conversation.lastMessage = text || "Sent an image";
    conversation.lastMessageId = String(message._id);

    const unreadCounts = conversation.unreadCounts ?? new Map<string, number>();
    for (const memberId of memberIds) {
      if (memberId === identityId) continue;
      unreadCounts.set(memberId, (unreadCounts.get(memberId) || 0) + 1);
    }
    unreadCounts.set(identityId, 0);
    conversation.unreadCounts = unreadCounts;

    await conversation.save();

    res.status(201).json({
      success: true,
      message,
    });
  }
);

// get all messages for a conversation --- only participants may read, and
// reading marks the other party's messages as seen / clears the unread badge
export const getAllMessages = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identityId = getIdentityId(req);

    if (!identityId) {
      return next(new ErrorHandler("Please login to view messages", 401));
    }

    const conversationId = req.params.id as string;

    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return next(new ErrorHandler("Conversation not found", 404));
    }

    if (!conversation.members.map(String).includes(identityId)) {
      return next(new ErrorHandler("You are not a participant of this conversation", 403));
    }

    const messages = await MessageModel.find({ conversationId }).sort({ createdAt: 1 });

    await MessageModel.updateMany(
      { conversationId, sender: { $ne: identityId }, seen: false },
      { $set: { seen: true } }
    );

    const unreadCounts = conversation.unreadCounts;
    if (unreadCounts && (unreadCounts.get(identityId) || 0) !== 0) {
      unreadCounts.set(identityId, 0);
      conversation.unreadCounts = unreadCounts;
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      messages,
    });
  }
);