import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import OrderModel from "../models/order.model.js";
import ShopModel from "../models/shop.model.js";
import ProductModel from "../models/product.model.js";

interface ICartItem {
  _id: string;
  shopId: string;
  qty: number;
  [key: string]: unknown;
}

// create new order
export const createOrder = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cart, shippingAddress, paymentInfo } = req.body;

      if (!req.user) {
        return next(new ErrorHandler("Please login to place an order", 401));
      }

      // group cart items by shopId
      const shopItemsMap = new Map<string, ICartItem[]>();

      for (const item of cart as ICartItem[]) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId)?.push(item);
      }

      // create an order for each shop
      const orders = [];

      for (const [, items] of shopItemsMap) {
        // Derive totalPrice server-side from trusted product prices instead
        // of trusting the client-supplied amount.
        let totalPrice = 0;
        for (const item of items) {
          const product = await ProductModel.findById(item._id);
          if (!product) {
            return next(
              new ErrorHandler(`Product not found with this id: ${item._id}`, 400)
            );
          }
          totalPrice += product.discountPrice * item.qty;
        }

        const order = await OrderModel.create({
          cart: items,
          shippingAddress,
          user: req.user,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);
// get all orders of user
export const getAllOrdersUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await OrderModel.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// get all orders of seller
export const getSellerAllOrders = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await OrderModel.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// update order status for seller
export const updateOrderStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      const sellerId = req.seller?._id;
      const cartItems = order.cart as ICartItem[];
      const belongsToSeller =
        !!sellerId &&
        cartItems.length > 0 &&
        cartItems.every((item) => String(item.shopId) === String(sellerId));

      if (!belongsToSeller) {
        return next(
          new ErrorHandler("You are not authorized to update this order", 403)
        );
      }

      const updateOrder = async (id: string, qty: number): Promise<void> => {
        const product = await ProductModel.findById(id);
        if (product) {
          product.stock -= qty;
          product.sold_out = (product.sold_out || 0) + qty;
          await product.save({ validateBeforeSave: false });
        }
      };

      const updateSellerInfo = async (amount: number): Promise<void> => {
        const sellerId = req.seller?._id;
        if (sellerId) {
          const seller = await ShopModel.findById(sellerId);
          if (seller) {
            seller.availableBalance = (seller.availableBalance || 0) + amount;
            await seller.save();
          }
        }
      };

      if (req.body.status === "Transferred to delivery partner") {
        for (const item of order.cart as ICartItem[]) {
          await updateOrder(item._id, item.qty);
        }
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = new Date();
        if (order.paymentInfo) {
          order.paymentInfo.status = "Succeeded";
        }
        const serviceCharge = order.totalPrice * 0.1;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// give a refund ----- user
export const orderRefund = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// accept the refund ---- seller
export const orderRefundSuccess = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successfull!",
      });

      const updateOrder = async (id: string, qty: number): Promise<void> => {
        const product = await ProductModel.findById(id);
        if (product) {
          product.stock += qty;
          product.sold_out = (product.sold_out || 0) - qty;
          await product.save({ validateBeforeSave: false });
        }
      };

      if (req.body.status === "Refund Success") {
        for (const item of order.cart as ICartItem[]) {
          await updateOrder(item._id, item.qty);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);

// all orders --- for admin
export const getAdminAllOrders = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await OrderModel.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 500));
    }
  }
);