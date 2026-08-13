import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ShopModel from "../models/shop.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { createNotification } from "../utils/notifications.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import sendEmail from "../utils/sendEmail.js";
import WithdrawModel, { IWithdraw } from "../models/withdraw.model.js";
import { publishSocketEvent } from "../socket/index.js";

// replace entire createWithdrawRequest export with:
export const createWithdrawRequest = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { amount } = req.body;
    const seller = req.seller;

    if (!seller) {
      return next(new ErrorHandler("Seller not found in request", 400));
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return next(new ErrorHandler("Please provide a valid withdrawal amount", 400));
    }

    const session = await mongoose.startSession();
    let withdraw: any;

    try {
      await session.withTransaction(async () => {
        const shop = await ShopModel.findOneAndUpdate(
          { _id: seller._id, availableBalance: { $gte: amount } },
          { $inc: { availableBalance: -amount } },
          { new: true, session }
        );

        if (!shop) {
          const existingShop = await ShopModel.findById(seller._id).select("availableBalance").session(session);
          const available = existingShop?.availableBalance ?? 0;
          throw new ErrorHandler(`Insufficient balance. Available balance is $${available.toFixed(2)}`, 400);
        }

        const createdWithdraws = await WithdrawModel.create([{ shopId: shop._id, seller, amount }], { session });
        withdraw = createdWithdraws[0];
      });
    } finally {
      await session.endSession();
    }

    try {
      await sendEmail({
        email: seller.email,
        subject: "Withdraw Request",
        message: `Hello ${seller.name}, Your withdraw request of $${amount} is processing. It will take 3 to 7 days to process!`,
      });
    } catch {
      // best-effort notification
    }

    res.status(201).json({ success: true, withdraw });
  }
);

// get withdraw requests belonging to the authenticated seller's own shop
export const getMyWithdrawRequests = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const seller = req.seller;

    if (!seller) {
      return next(new ErrorHandler("Seller not found in request", 400));
    }

    const { page, limit } = parsePagination(req.query, 20, 100);
    const filter = { shopId: seller._id };

    const [withdraws, totalItems] = await Promise.all([
      WithdrawModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WithdrawModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      withdraws,
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// get all withdraws --- admin
export const getAllWithdrawRequests = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page, limit } = parsePagination(req.query, 20, 100);

    const [withdraws, totalItems] = await Promise.all([
      WithdrawModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WithdrawModel.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      withdraws,
      pagination: buildPaginationMeta(page, limit, totalItems),
    });
  }
);

// update withdraw request ---- admin
export const updateWithdrawRequest = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const withdrawId = req.params.id as string;

    // Atomic guard: only a currently-"Processing" withdrawal can be marked
    // paid. Prevents a duplicate admin click, or a race against
    // rejectWithdrawRequest, from marking an already-rejected (and
    // balance-restored) withdrawal as paid too — which would let the
    // seller both keep the restored balance and have the payout recorded
    // as sent.
    const withdraw = await WithdrawModel.findOneAndUpdate(
      { _id: withdrawId, status: "Processing" },
      { status: "succeed", updatedAt: new Date() },
      { new: true }
    );

    if (!withdraw) {
      return next(new ErrorHandler("Withdraw request not found or already resolved", 404));
    }

    // The seller is derived from the withdrawal record itself rather than
    // a client-supplied sellerId, so this can never attribute a payout to
    // the wrong seller's transaction history.
    const seller = await ShopModel.findById(withdraw.shopId);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    const transection = {
      _id: withdraw._id,
      amount: withdraw.amount,
      updatedAt: withdraw.updatedAt,
      status: withdraw.status,
    };

    if (!seller.transaction) {
      seller.transaction = [];
    }

    seller.transaction.push(transection);

    await seller.save();

    createNotification(
      String(seller._id),
      "seller",
      "withdraw_approved",
      `Your withdrawal request of $${withdraw.amount} has been approved and is on its way.`,
      "/seller/dashboard?tab=payouts"
    ).catch(() => { });

    await sendEmail({
      email: seller.email,
      subject: "Payment confirmation",
      message: `Hello ${seller.name}, Your withdraw request of ${withdraw.amount}$ is on the way. Delivery time depends on your bank's rules it usually takes 3days to 7days.`,
    });

    res.status(201).json({
      success: true,
      withdraw,
    });
  }
);

// add new export
export const rejectWithdrawRequest = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const withdrawId = req.params.id as string;
    const { reason } = req.body as { reason?: string };

    const session = await mongoose.startSession();
    let resolvedWithdraw: IWithdraw | null = null;

    try {
      await session.withTransaction(async () => {
        // Atomic guard, mirroring updateWithdrawRequest above: only a
        // currently-"Processing" withdrawal can be rejected, so this can
        // never race against (or trail) an approval of the same request.
        const updated = await WithdrawModel.findOneAndUpdate(
          { _id: withdrawId, status: "Processing" },
          { $set: { status: "rejected", rejectionReason: reason } },
          { new: true, session }
        );

        if (!updated) {
          throw new ErrorHandler("Withdraw request not found or already resolved", 404);
        }

        await ShopModel.findByIdAndUpdate(
          updated.shopId,
          { $inc: { availableBalance: updated.amount } },
          { session }
        );

        resolvedWithdraw = updated;
      });
    } finally {
      await session.endSession();
    }

    const withdraw = resolvedWithdraw as unknown as IWithdraw;

    const seller = await ShopModel.findById(withdraw.shopId);
    if (seller) {
      try {
        await sendEmail({
          email: seller.email,
          subject: "Withdrawal request rejected",
          message: `Hello ${seller.name}, your withdrawal request of $${withdraw.amount} was rejected${reason ? `: ${reason}` : "."} The amount has been returned to your available balance.`,
        });
      } catch {
        // best-effort
      }
      createNotification(
        String(seller._id),
        "seller",
        "withdraw_rejected",
        `Your withdrawal request of $${withdraw.amount} was rejected${reason ? `: ${reason}` : "."}`,
        "/seller/dashboard?tab=payouts"
      ).catch(() => { });

      void publishSocketEvent(String(seller._id), "sellerBalanceUpdated", {
        availableBalance: seller.availableBalance,
        owedBalance: seller.owedBalance,
      });
    }

    res.status(200).json({ success: true, withdraw });
  }
);
