import express from "express";
import {
  createEvent,
  getAllEvents,
  getShopAllEvents,
  deleteShopEvent,
  getAdminAllEvents,
} from "../controllers/event.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const eventRouter = express.Router();

eventRouter.post("/create-event", createEvent);
eventRouter.get("/get-all-events", getAllEvents);
eventRouter.get("/get-all-events/:id", getShopAllEvents);
eventRouter.delete("/delete-shop-event/:id", deleteShopEvent);
eventRouter.get(
  "/admin-all-events",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllEvents
);

export default eventRouter;