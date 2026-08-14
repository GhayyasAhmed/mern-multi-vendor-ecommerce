import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import ConversationModel, { IConversation } from "../models/conversation.model.js";
import ShopModel, { IShop } from "../models/shop.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { publishSocketEvent } from "../socket/index.js";

const getUnreadCount = (conversation: IConversation, memberId: string): number => {
  const unreadCounts = conversation.unreadCounts;
  if (!unreadCounts) return 0;
  if (unreadCounts instanceof Map) return unreadCounts.get(memberId) || 0;
  return (unreadCounts as unknown as Record<string, number>)[memberId] || 0;
};

const decorateForMember = (conversation: IConversation, memberId: string) => {
  const plain: any =
    typeof (conversation as any).toObject === "function"
      ? (conversation as any).toObject({ flattenMaps: true })
      : conversation;
  const unreadCount = getUnreadCount(conversation, memberId);
  const { unreadCounts, ...rest } = plain;
  return { ...rest, unreadCount };
};

// create (or reuse) a conversation between the authenticated user and a shop
export const createNewConversation = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new ErrorHandler("Please login to start a conversation", 401));
    }

    const { sellerId } = req.body;

    const shop: IShop | null = await ShopModel.findById(sellerId);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    const userId = String(req.user._id);
    const groupTitle: string = `${userId}_${String(shop._id)}`;

    let conversation: IConversation | null = await ConversationModel.findOne({ groupTitle });
    let isNewConversation = !conversation;

    if (!conversation) {
      const conversationData = {
        members: [userId, String(shop._id)],
        groupTitle,
        userId,
        sellerId: String(shop._id),
        user: {
          id: userId,
          name: req.user.name,
          avatar: req.user.avatar?.url,
        },
        seller: {
          id: String(shop._id),
          name: shop.name,
          avatar: shop.avatar?.url,
        },
      };

      try {
        conversation = await ConversationModel.create(conversationData);
      } catch (error: any) {
        if (error?.code === 11000) {
          conversation = await ConversationModel.findOne({ groupTitle });
          isNewConversation = false;
        } else {
          throw error;
        }
      }
    }

    if (!conversation) {
      return next(new ErrorHandler("Could not start conversation", 500));
    }

    if (isNewConversation) {
      void publishSocketEvent(String(shop._id), "newConversation", decorateForMember(conversation, String(shop._id)));
    }

    res.status(201).json({
      success: true,
      conversation: decorateForMember(conversation, userId),
    });
  }
);

// get seller conversations
export const getSellerAllConversations = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.seller) {
      return next(new ErrorHandler("Please login to view your conversations", 401));
    }

    const sellerId = String(req.seller._id);

    if (req.params.id && req.params.id !== sellerId) {
      return next(new ErrorHandler("You are not authorized to view these conversations", 403));
    }

    const { page, limit } = parsePagination(req.query, 20, 100);
    const filter = { members: { $in: [sellerId] } };

    const [conversations, totalItems] = await Promise.all([
      ConversationModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      ConversationModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      conversations: conversations.map((c) => decorateForMember(c, sellerId)),
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// get user conversations
export const getUserAllConversations = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new ErrorHandler("Please login to view your conversations", 401));
    }

    const userId = String(req.user._id);

    if (req.params.id && req.params.id !== userId) {
      return next(new ErrorHandler("You are not authorized to view these conversations", 403));
    }

    const { page, limit } = parsePagination(req.query, 20, 100);
    const filter = { members: { $in: [userId] } };

    const [conversations, totalItems] = await Promise.all([
      ConversationModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      ConversationModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      conversations: conversations.map((c) => decorateForMember(c, userId)),
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// update the last message preview of a conversation the requester belongs to
export const updateLastMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identityId = req.user?._id
      ? String(req.user._id)
      : req.seller?._id
      ? String(req.seller._id)
      : undefined;

    if (!identityId) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const { lastMessage, lastMessageId } = req.body;
    const conversationId = req.params.id as string;

    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return next(new ErrorHandler("Conversation not found with this id", 404));
    }

    if (!conversation.members.map(String).includes(identityId)) {
      return next(new ErrorHandler("You are not a participant of this conversation", 403));
    }

    conversation.lastMessage = lastMessage;
    conversation.lastMessageId = lastMessageId;
    await conversation.save();

    res.status(200).json({
      success: true,
      conversation: decorateForMember(conversation, identityId),
    });
  }
);