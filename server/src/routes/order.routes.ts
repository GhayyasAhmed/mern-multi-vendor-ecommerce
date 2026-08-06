import express from "express";
import {
  createOrder,
  getAllOrdersUser,
  getSellerAllOrders,
  getOrderById,
  updateOrderStatus,
  orderRefund,
  orderRefundSuccess,
  getAdminAllOrders,
} from "../controllers/order.controller.js";
import { isAuthenticated, isSeller, authorizeRoles, attachIdentity } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { OrderValidations } from "../utils/validators.js";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, validate(OrderValidations.createOrderSchema), createOrder);
orderRouter.get("/get-all-orders/:userId", isAuthenticated, getAllOrdersUser);
orderRouter.get("/get-seller-all-orders/:shopId", isSeller, getSellerAllOrders);
orderRouter.get("/get-order/:id", attachIdentity, getOrderById);
orderRouter.put(
  "/update-order-status/:id",
  isSeller,
  validate(OrderValidations.updateOrderStatusSchema),
  updateOrderStatus
);
orderRouter.put("/order-refund/:id", isAuthenticated, orderRefund);
orderRouter.put("/order-refund-success/:id", isSeller, orderRefundSuccess);
orderRouter.get(
  "/admin-all-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllOrders
);

export default orderRouter;