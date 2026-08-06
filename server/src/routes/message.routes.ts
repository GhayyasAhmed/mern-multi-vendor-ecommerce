import express from "express";
import {
  createNewMessage,
  getAllMessages,
} from "../controllers/message.controller.js";
import { attachIdentity } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { MessageValidations } from "../utils/validators.js";

const messageRouter = express.Router();

messageRouter.post(
  "/create-new-message",
  attachIdentity,
  validate(MessageValidations.createMessageSchema),
  createNewMessage
);
messageRouter.get("/get-all-messages/:id", attachIdentity, getAllMessages);

export default messageRouter;