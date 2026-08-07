import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import CouponCodeModel from "../models/couponCode.model.js";
import EventModel from "../models/event.model.js";
import OrderModel, { IOrder, IShippingAddress } from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import ShopModel from "../models/shop.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { calculateCouponDiscount } from "./couponCode.controller.js";
import { stripe } from "../config/stripe.js";
import { createNotification } from "../utils/notifications.js";

interface ICartItem {
  _id: string;
  shopId: string;
  qty: number;
  kind?: "product" | "event";
  [key: string]: unknown;
}


// create new order
export const createOrder = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { cart, shippingAddress, paymentInfo, couponCode } = req.body as {
      cart: ICartItem[];
      shippingAddress: IShippingAddress;
      paymentInfo?: { id?: string; type?: string };
      couponCode?: string;
    };

    if (!req.user) {
      return next(new ErrorHandler("Please login to place an order", 401));
    }

    // Payment status is NEVER accepted from the client — only Stripe's
    // webhook (stripeWebhook in payment.controller.ts) is authoritative for
    // flipping it to "Succeeded"/"Failed". For card payments, the
    // PaymentIntent's existence is also verified here so a fabricated id
    // can't be attached to an order.
    let resolvedPaymentInfo: { id?: string; type: string; status: string };
    if (paymentInfo?.type === "Card") {
      if (!paymentInfo.id) {
        return next(new ErrorHandler("A payment reference is required for card payments", 400));
      }
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentInfo.id);
      } catch {
        return next(new ErrorHandler("Could not verify this payment with Stripe", 400));
      }
      if (!paymentIntent || paymentIntent.status === "canceled") {
        return next(new ErrorHandler("This payment is invalid or was canceled", 400));
      }
      resolvedPaymentInfo = {
        id: paymentIntent.id,
        type: "Card",
        status: paymentIntent.status === "succeeded" ? "Succeeded" : "Pending",
      };
    } else {
      resolvedPaymentInfo = { type: "Cash On Delivery", status: "Pending" };
    }

    const shopItemsMap = new Map<string, ICartItem[]>();
    for (const item of cart) {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId)?.push(item);
    }

    const coupon = couponCode ? await CouponCodeModel.findOne({ name: couponCode }) : null;

    const session = await mongoose.startSession();
    const orders: IOrder[] = [];

    try {
      await session.withTransaction(async () => {
        // Pass 1: atomically reserve stock (and bump sold_out) for every
        // item across every shop. If any reservation fails because stock
        // dropped below the requested qty, throw to abort the whole
        // transaction — nothing else needs to be manually rolled back.
        for (const [, items] of shopItemsMap) {
          for (const item of items) {
            const isEvent = item.kind === "event";
            const Model = (isEvent ? EventModel : ProductModel) as unknown as mongoose.Model<any>;

            const reserved = await Model.findOneAndUpdate(
              { _id: item._id, stock: { $gte: item.qty } },
              { $inc: { stock: -item.qty, sold_out: item.qty } },
              { session, new: true }
            );

            if (!reserved) {
              const existing = await Model.findById(item._id).session(session);
              if (!existing) {
                throw new ErrorHandler(
                  `${isEvent ? "Event" : "Product"} not found with this id: ${item._id}`,
                  400
                );
              }
              throw new ErrorHandler(
                `Only ${existing.stock} unit(s) of "${existing.name}" left in stock`,
                400
              );
            }
          }
        }

        // Pass 2: stock is now safely reserved for every shop, so compute
        // pricing and create each shop's order inside the same transaction.
        // Either every shop's order is created, or none are.
        for (const [shopId, items] of shopItemsMap) {
          let subtotal = 0;
          for (const item of items) {
            const isEvent = item.kind === "event";
            const purchasable = (isEvent
              ? await EventModel.findById(item._id).session(session)
              : await ProductModel.findById(item._id).session(session)) as any;
            subtotal += purchasable.discountPrice * item.qty;
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

          const createdOrders = await OrderModel.create(
            [
              {
                cart: items,
                shippingAddress,
                user: req.user,
                totalPrice,
                paymentInfo: resolvedPaymentInfo,
                coupon: appliedCoupon,
              },
            ],
            { session }
          );
          const order = createdOrders[0];
          if (!order) {
            throw new ErrorHandler("Failed to create order", 500);
          }
          orders.push(order as IOrder);
        }
      });
    } finally {
      await session.endSession();
    }

    for (const [shopId] of shopItemsMap) {
      createNotification(shopId, "seller", "new_order", "You have received a new order.", "/seller/dashboard?tab=orders").catch(() => { });
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

    const { page, limit } = parsePagination(req.query, 10, 50);
    const filter = { "user._id": req.user._id };

    const [orders, totalItems] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      OrderModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: buildPaginationMeta(page, limit, totalItems),
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

    const { page, limit } = parsePagination(req.query, 10, 50);
    const filter = { "cart.shopId": req.seller._id };

    const [orders, totalItems] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      OrderModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: buildPaginationMeta(page, limit, totalItems),
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

    // Stock is now reserved atomically at order-creation time (createOrder),
    // so no further decrement happens on this status transition.
    order.status = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = new Date();
      if (order.paymentInfo) {
        order.paymentInfo.status = "Succeeded";
      }
      const serviceCharge = order.totalPrice * 0.1;
      const netAmount = order.totalPrice - serviceCharge;

      // Atomic $inc avoids losing concurrent credits under a
      // read-modify-write race when a seller processes many deliveries at once.
      await ShopModel.findByIdAndUpdate(sellerId, { $inc: { availableBalance: netAmount } });
    }

    await order.save({ validateBeforeSave: false });

    const buyerIdForNotif = (order.user as { _id?: unknown })?._id;
    if (buyerIdForNotif) {
      createNotification(
        String(buyerIdForNotif),
        "user",
        "order_status",
        `Your order #${String(order._id).slice(-8).toUpperCase()} is now "${order.status}"`,
        `/orders/${order._id}`
      ).catch(() => { });
    }

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

    // Atomic restock — avoids the same read-modify-write race as the stock
    // reservation/crediting above.
    const restock = async (id: string, qty: number, kind?: string): Promise<void> => {
      const Model = (kind === "event" ? EventModel : ProductModel) as unknown as mongoose.Model<any>;
      await Model.findByIdAndUpdate(id, { $inc: { stock: qty, sold_out: -qty } });
    };

    for (const item of cartItems) {
      await restock(item._id, item.qty, item.kind);
    }
  }
);

// all orders --- for admin
export const getAdminAllOrders = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page, limit } = parsePagination(req.query, 20, 100);

    const [orders, totalItems] = await Promise.all([
      OrderModel.find().sort({ deliveredAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      OrderModel.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);