import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import UserModel from "../models/user.model.js";
import ShopModel from "../models/shop.model.js";
import ProductModel from "../models/product.model.js";
import EventModel from "../models/event.model.js";
import OrderModel from "../models/order.model.js";
import WithdrawModel from "../models/withdraw.model.js";

// Lightweight counts for the admin dashboard overview — uses countDocuments
// instead of relying on the (now paginated) list endpoints, so the numbers
// shown reflect true totals rather than a single page's length.
export const getAdminStats = catchAsyncErrors(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const [userCount, sellerCount, productCount, eventCount, orderCount, pendingWithdrawCount] =
      await Promise.all([
        UserModel.countDocuments(),
        ShopModel.countDocuments(),
        ProductModel.countDocuments(),
        EventModel.countDocuments(),
        OrderModel.countDocuments(),
        WithdrawModel.countDocuments({ status: "Processing" }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        sellerCount,
        productCount,
        eventCount,
        orderCount,
        pendingWithdrawCount,
      },
    });
  }
);