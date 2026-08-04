import express from "express";
import {
  createNewConversation,
  getSellerAllConversations,
  getUserAllConversations,
  updateLastMessage,
} from "../controllers/conversation.controller.js";
import { isAuthenticated, isSeller } from "../middlewares/auth.js";

const conversationRouter = express.Router();

conversationRouter.post("/create-new-conversation", createNewConversation);
conversationRouter.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  getSellerAllConversations
);
conversationRouter.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  getUserAllConversations
);
conversationRouter.put("/update-last-message/:id", updateLastMessage);

export default conversationRouter;