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
// update order status for seller
export const updateOrderStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const existingOrder = await OrderModel.findById(req.params.id);

    if (!existingOrder) {
      return next(new ErrorHandler("Order not found with this id", 400));
    }

    const sellerId = req.seller?._id;
    const cartItems = existingOrder.cart as ICartItem[];
    const belongsToSeller =
      !!sellerId &&
      cartItems.length > 0 &&
      cartItems.every((item) => String(item.shopId) === String(sellerId));

    if (!belongsToSeller) {
      return next(new ErrorHandler("You are not authorized to update this order", 403));
    }

    const newStatus = req.body.status as string;

    // Once an order has left the normal fulfillment flow (delivered, or in
    // any refund state), it must only move further through the refund
    // endpoints below — never back through a plain status update. Without
    // this guard a seller could bounce an order Delivered -> Processing ->
    // Delivered again and have their balance credited twice for one order.
    if (
      existingOrder.status === "Delivered" ||
      existingOrder.status === "Processing Refund" ||
      existingOrder.status === "Refund Success"
    ) {
      return next(
        new ErrorHandler(`This order is already "${existingOrder.status}" and cannot be updated this way`, 400)
      );
    }

    if (newStatus !== "Delivered") {
      existingOrder.status = newStatus;
      await existingOrder.save({ validateBeforeSave: false });

      const buyerIdForNotif = (existingOrder.user as { _id?: unknown })?._id;
      if (buyerIdForNotif) {
        createNotification(
          String(buyerIdForNotif),
          "user",
          "order_status",
          `Your order #${String(existingOrder._id).slice(-8).toUpperCase()} is now "${existingOrder.status}"`,
          `/orders/${existingOrder._id}`
        ).catch(() => { });
      }

      res.status(200).json({ success: true, order: existingOrder });
      return;
    }

    // Delivering: credit the seller's balance exactly once, atomically,
    // guarded so a duplicate/concurrent request can never double-credit.
    const serviceCharge = existingOrder.totalPrice * 0.1;
    const netAmount = existingOrder.totalPrice - serviceCharge;

    const session = await mongoose.startSession();
    let deliveredOrder: IOrder | null = null;

    try {
      await session.withTransaction(async () => {
        const updated = await OrderModel.findOneAndUpdate(
          { _id: existingOrder._id, status: { $ne: "Delivered" } },
          {
            $set: {
              status: "Delivered",
              deliveredAt: new Date(),
              "paymentInfo.status": "Succeeded",
              sellerCreditedAmount: netAmount,
            },
          },
          { new: true, session }
        );

        if (!updated) {
          throw new ErrorHandler("This order was already delivered", 409);
        }

        const shop = await ShopModel.findById(sellerId).session(session);
        if (!shop) {
          throw new ErrorHandler("Shop not found", 404);
        }

        // Any outstanding owedBalance (from a prior refund that couldn't be
        // fully clawed back because the money had already been withdrawn)
        // is repaid out of this new credit first; only the remainder, if
        // any, becomes withdrawable availableBalance.
        const owed = shop.owedBalance || 0;
        const repayment = Math.min(owed, netAmount);
        const toAvailable = netAmount - repayment;

        await ShopModel.findByIdAndUpdate(
          sellerId,
          { $inc: { owedBalance: -repayment, availableBalance: toAvailable } },
          { session }
        );

        deliveredOrder = updated;
      });
    } finally {
      await session.endSession();
    }

    const finalOrder = deliveredOrder as unknown as IOrder;

    const buyerIdForNotif = (finalOrder.user as { _id?: unknown })?._id;
    if (buyerIdForNotif) {
      createNotification(
        String(buyerIdForNotif),
        "user",
        "order_status",
        `Your order #${String(finalOrder._id).slice(-8).toUpperCase()} is now "Delivered"`,
        `/orders/${finalOrder._id}`
      ).catch(() => { });
    }

    res.status(200).json({ success: true, order: finalOrder });
  }
);

// user requests a refund for their own delivered order
// user requests a refund for their own delivered order
export const orderRefund = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const existingOrder = await OrderModel.findById(req.params.id);

    if (!existingOrder) {
      return next(new ErrorHandler("Order not found with this id", 400));
    }

    const buyerId = (existingOrder.user as { _id?: unknown })?._id;
    if (!req.user || String(buyerId) !== String(req.user._id)) {
      return next(new ErrorHandler("You are not authorized to refund this order", 403));
    }

    // Atomic guard: only a currently-"Delivered" order can move to
    // "Processing Refund", so a duplicate click/request can't produce two
    // separate refund requests for the same order.
    const updated = await OrderModel.findOneAndUpdate(
      { _id: existingOrder._id, status: "Delivered" },
      { $set: { status: "Processing Refund" } },
      { new: true }
    );

    if (!updated) {
      return next(new ErrorHandler("Only delivered orders can be refunded", 400));
    }

    res.status(200).json({
      success: true,
      order: updated,
      message: "Order Refund Request successfully!",
    });
  }
);

// seller accepts a pending refund request
export const orderRefundSuccess = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sellerId = req.seller?._id;
    if (!sellerId) {
      return next(new ErrorHandler("You are not authorized to update this order", 403));
    }

    const preCheckOrder = await OrderModel.findById(req.params.id);
    if (!preCheckOrder) {
      return next(new ErrorHandler("Order not found with this id", 400));
    }

    const cartItems = preCheckOrder.cart as ICartItem[];
    const belongsToSeller =
      cartItems.length > 0 && cartItems.every((item) => String(item.shopId) === String(sellerId));

    if (!belongsToSeller) {
      return next(new ErrorHandler("You are not authorized to update this order", 403));
    }

    const session = await mongoose.startSession();
    let refundedOrder: IOrder | null = null;

    try {
      await session.withTransaction(async () => {
        // Atomic guard: only a currently-"Processing Refund" order can be
        // marked "Refund Success", so a duplicate/concurrent approval can
        // never reverse the seller's balance twice for the same order.
        const updated = await OrderModel.findOneAndUpdate(
          { _id: preCheckOrder._id, status: "Processing Refund" },
          { $set: { status: "Refund Success" } },
          { new: true, session }
        );

        if (!updated) {
          throw new ErrorHandler("This order is not awaiting a refund", 400);
        }

        const creditedAmount = updated.sellerCreditedAmount || 0;

        if (creditedAmount > 0) {
          const shop = await ShopModel.findById(sellerId).session(session);
          if (!shop) {
            throw new ErrorHandler("Shop not found", 404);
          }

          // Claw back what was credited to the seller at delivery. The
          // seller may already have withdrawn some or all of it, so
          // availableBalance can only be pulled down to zero — never
          // negative. Whatever can't be recovered here becomes
          // owedBalance, automatically repaid out of the seller's next
          // delivered-order credit(s) before any of it reaches
          // availableBalance again (see updateOrderStatus above).
          const recoverable = Math.min(shop.availableBalance || 0, creditedAmount);
          const shortfall = creditedAmount - recoverable;

          await ShopModel.findByIdAndUpdate(
            sellerId,
            { $inc: { availableBalance: -recoverable, owedBalance: shortfall } },
            { session }
          );
        }

        // Restock inside the same transaction so inventory and the
        // financial reversal are atomic together.
        for (const item of cartItems) {
          const isEvent = item.kind === "event";
          const Model = (isEvent ? EventModel : ProductModel) as unknown as mongoose.Model<any>;
          await Model.findByIdAndUpdate(
            item._id,
            { $inc: { stock: item.qty, sold_out: -item.qty } },
            { session }
          );
        }

        refundedOrder = updated;
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      success: true,
      order: refundedOrder,
      message: "Order Refund successfull!",
    });
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