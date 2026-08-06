import express from "express";
import {
  createNewConversation,
  getSellerAllConversations,
  getUserAllConversations,
  updateLastMessage,
} from "../controllers/conversation.controller.js";
import { isAuthenticated, isSeller, attachIdentity } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { ConversationValidations } from "../utils/validators.js";

const conversationRouter = express.Router();

conversationRouter.post(
  "/create-new-conversation",
  isAuthenticated,
  validate(ConversationValidations.createConversationSchema),
  createNewConversation
);
conversationRouter.get("/get-all-conversation-seller/:id", isSeller, getSellerAllConversations);
conversationRouter.get("/get-all-conversation-user/:id", isAuthenticated, getUserAllConversations);
conversationRouter.put(
  "/update-last-message/:id",
  attachIdentity,
  validate(ConversationValidations.updateLastMessageSchema),
  updateLastMessage
);

export default conversationRouter;