import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import OrderModel, { IShippingAddress, IOrder } from "../models/order.model.js";
import ShopModel from "../models/shop.model.js";
import ProductModel from "../models/product.model.js";
import CouponCodeModel from "../models/couponCode.model.js";
import { calculateCouponDiscount } from "./couponCode.controller.js";

interface ICartItem {
  _id: string;
  shopId: string;
  qty: number;
  [key: string]: unknown;
}

// create new order
export const createOrder = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { cart, shippingAddress, paymentInfo, couponCode } = req.body as {
      cart: ICartItem[];
      shippingAddress: IShippingAddress;
      paymentInfo?: { id?: string; status?: string; type?: string };
      couponCode?: string;
    };

    if (!req.user) {
      return next(new ErrorHandler("Please login to place an order", 401));
    }

    // group cart items by shopId
    const shopItemsMap = new Map<string, ICartItem[]>();

    for (const item of cart) {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId)?.push(item);
    }

    const coupon = couponCode ? await CouponCodeModel.findOne({ name: couponCode }) : null;

    // create an order for each shop
    const orders: IOrder[] = [];

    for (const [shopId, items] of shopItemsMap) {
      // Derive totalPrice server-side from trusted product prices instead
      // of trusting the client-supplied amount, and validate stock.
      let subtotal = 0;
      for (const item of items) {
        const product = await ProductModel.findById(item._id);
        if (!product) {
          return next(
            new ErrorHandler(`Product not found with this id: ${item._id}`, 400)
          );
        }
        if (product.stock < item.qty) {
          return next(
            new ErrorHandler(
              `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
              400
            )
          );
        }
        subtotal += product.discountPrice * item.qty;
      }

      let totalPrice = subtotal;
      let appliedCoupon: { name: string; discountAmount: number } | undefined;

      if (coupon && String(coupon.shopId) === String(shopId)) {
        const productIds = items.map((item) => String(item._id));
        const result = calculateCouponDiscount(coupon, subtotal, productIds);
        if (result.valid) {
          totalPrice = Math.max(subtotal - result.discountAmount, 0);
          appliedCoupon = { name: coupon.name, discountAmount: result.discountAmount };
        }
      }

      const order = await OrderModel.create({
        cart: items,
        shippingAddress,
        user: req.user,
        totalPrice,
        paymentInfo: paymentInfo || { type: "Cash On Delivery", status: "Pending" },
        coupon: appliedCoupon,
      });
      orders.push(order);
    }

    res.status(201).json({
      success: true,
      orders,
    });
  }
);

// get all orders of the authenticated user
export const getAllOrdersUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new ErrorHandler("Please login to view your orders", 401));
    }

    if (req.params.userId && req.params.userId !== String(req.user._id)) {
      return next(new ErrorHandler("You are not authorized to view these orders", 403));
    }

    const orders = await OrderModel.find({ "user._id": req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  }
);

// get all orders of the authenticated seller's shop
export const getSellerAllOrders = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.seller) {
      return next(new ErrorHandler("Please login to view your shop orders", 401));
    }

    if (req.params.shopId && req.params.shopId !== String(req.seller._id)) {
      return next(new ErrorHandler("You are not authorized to view these orders", 403));
    }

    const orders = await OrderModel.find({
      "cart.shopId": req.seller._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  }
);

// get a single order --- accessible by the order's buyer, an involved seller, or an admin
export const getOrderById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    const cartItems = order.cart as ICartItem[];
    const buyerId = (order.user as { _id?: unknown })?._id;
    const isBuyer = !!req.user && String(buyerId) === String(req.user._id);
    const isInvolvedSeller =
      !!req.seller && cartItems.some((item) => String(item.shopId) === String(req.seller!._id));
    const isAdmin = req.user?.role === "admin";

    if (!isBuyer && !isInvolvedSeller && !isAdmin) {
      return next(new ErrorHandler("You are not authorized to view this order", 403));
    }

    res.status(200).json({
      success: true,
      order,
    });
  }
);

// update order status for seller
export const updateOrderStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      return next(new ErrorHandler("You are not authorized to update this order", 403));
    }

    const decrementStock = async (id: string, qty: number): Promise<void> => {
      const product = await ProductModel.findById(id);
      if (product) {
        product.stock -= qty;
        product.sold_out = (product.sold_out || 0) + qty;
        await product.save({ validateBeforeSave: false });
      }
    };

    const creditSeller = async (amount: number): Promise<void> => {
      if (sellerId) {
        const seller = await ShopModel.findById(sellerId);
        if (seller) {
          seller.availableBalance = (seller.availableBalance || 0) + amount;
          await seller.save();
        }
      }
    };

    if (req.body.status === "Transferred to delivery partner") {
      for (const item of cartItems) {
        await decrementStock(item._id, item.qty);
      }
    }

    order.status = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = new Date();
      if (order.paymentInfo) {
        order.paymentInfo.status = "Succeeded";
      }
      const serviceCharge = order.totalPrice * 0.1;
      await creditSeller(order.totalPrice - serviceCharge);
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      order,
    });
  }
);

// user requests a refund for their own delivered order
export const orderRefund = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 400));
    }

    const buyerId = (order.user as { _id?: unknown })?._id;
    if (!req.user || String(buyerId) !== String(req.user._id)) {
      return next(new ErrorHandler("You are not authorized to refund this order", 403));
    }

    if (order.status !== "Delivered") {
      return next(new ErrorHandler("Only delivered orders can be refunded", 400));
    }

    order.status = "Processing Refund";

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      order,
      message: "Order Refund Request successfully!",
    });
  }
);

// seller accepts a pending refund request
export const orderRefundSuccess = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 400));
    }

    const sellerId = req.seller?._id;
    const cartItems = order.cart as ICartItem[];
    const belongsToSeller =
      !!sellerId && cartItems.length > 0 && cartItems.every((item) => String(item.shopId) === String(sellerId));

    if (!belongsToSeller) {
      return next(new ErrorHandler("You are not authorized to update this order", 403));
    }

    if (order.status !== "Processing Refund") {
      return next(new ErrorHandler("This order is not awaiting a refund", 400));
    }

    order.status = "Refund Success";

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Order Refund successfull!",
    });

    const restock = async (id: string, qty: number): Promise<void> => {
      const product = await ProductModel.findById(id);
      if (product) {
        product.stock += qty;
        product.sold_out = Math.max((product.sold_out || 0) - qty, 0);
        await product.save({ validateBeforeSave: false });
      }
    };

    for (const item of cartItems) {
      await restock(item._id, item.qty);
    }
  }
);

// all orders --- for admin
export const getAdminAllOrders = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const orders = await OrderModel.find().sort({
      deliveredAt: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  }
);