import express from "express";
import {
  createWithdrawRequest,
  getAllWithdrawRequests,
  getMyWithdrawRequests,
  updateWithdrawRequest,
  rejectWithdrawRequest,
} from "../controllers/withdraw.controller.js";
import { isAuthenticated, isSeller, authorizeRoles } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { WithdrawValidations } from "../utils/validators.js";

const withdrawRouter = express.Router();

withdrawRouter.post(
  "/create-withdraw-request",
  isSeller,
  validate(WithdrawValidations.createWithdrawRequestSchema),
  createWithdrawRequest
);

withdrawRouter.get("/get-my-withdraw-requests", isSeller, getMyWithdrawRequests);


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

withdrawRouter.put(
  "/reject-withdraw-request/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  rejectWithdrawRequest
);

export default withdrawRouter;