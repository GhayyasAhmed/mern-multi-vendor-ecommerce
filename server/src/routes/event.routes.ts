import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  getShopAllEvents,
  deleteShopEvent,
  getAdminAllEvents,
} from "../controllers/event.controller.js";
import { isAuthenticated, authorizeRoles, isSeller } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { EventValidations } from "../utils/validators.js";

const eventRouter = express.Router();

eventRouter.post("/create-event", isSeller, validate(EventValidations.createEventSchema), createEvent);
eventRouter.get("/get-all-events", getAllEvents);
eventRouter.get("/get-event/:id", getEventById);
eventRouter.get("/get-all-events/:id", getShopAllEvents);
eventRouter.delete("/delete-shop-event/:id", isSeller, deleteShopEvent);
eventRouter.get(
  "/admin-all-events",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllEvents
);

export default eventRouter;