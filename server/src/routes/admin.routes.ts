import express from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";

const adminRouter = express.Router();

adminRouter.get("/stats", isAuthenticated, authorizeRoles("admin"), getAdminStats);

export default adminRouter;