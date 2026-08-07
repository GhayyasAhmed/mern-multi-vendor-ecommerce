import express from "express";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notification.controller.js";
import { attachIdentity } from "../middlewares/auth.js";

const notificationRouter = express.Router();

notificationRouter.get("/list", attachIdentity, getMyNotifications);
notificationRouter.put("/mark-read/:id", attachIdentity, markNotificationRead);
notificationRouter.put("/mark-all-read", attachIdentity, markAllNotificationsRead);

export default notificationRouter;