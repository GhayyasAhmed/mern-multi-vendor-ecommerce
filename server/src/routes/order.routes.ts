import express from "express";
import {
  createOrder,
  getAllOrdersUser,
  getSellerAllOrders,
  updateOrderStatus,
  orderRefund,
  orderRefundSuccess,
  getAdminAllOrders,
} from "../controllers/order.controller.js";
import { isAuthenticated, isSeller, authorizeRoles } from "../middlewares/auth.js";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);
orderRouter.get("/get-all-orders/:userId", isAuthenticated, getAllOrdersUser);
orderRouter.get("/get-seller-all-orders/:shopId", isSeller, getSellerAllOrders);
orderRouter.put("/update-order-status/:id", isSeller, updateOrderStatus);
orderRouter.put("/order-refund/:id", isAuthenticated, orderRefund);
orderRouter.put("/order-refund-success/:id", isSeller, orderRefundSuccess);
orderRouter.get(
  "/admin-all-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllOrders
);

export default orderRouter;