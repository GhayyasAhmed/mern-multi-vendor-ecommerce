import express from "express";
import {
  createWithdrawRequest,
  getAllWithdrawRequests,
  updateWithdrawRequest,
} from "../controllers/withdraw.controller.js";
import { isAuthenticated, isSeller, authorizeRoles } from"../middlewares/auth.js";

const withdrawRouter = express.Router();

withdrawRouter.post(
  "/create-withdraw-request",
  isSeller,
  createWithdrawRequest
);

withdrawRouter.get(
  "/get-all-withdraw-request",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllWithdrawRequests
);

withdrawRouter.put(
  "/update-withdraw-request/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateWithdrawRequest
);

export default withdrawRouter;