import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import WithdrawModel from "../models/withdraw.model.js";
import ShopModel from "../models/shop.model.js";
import sendEmail from "../utils/sendEmail.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js"

// create withdraw request --- only for seller. The balance deduction is a
// single atomic findOneAndUpdate (reserve-then-create) so two concurrent
// requests from the same seller can never both succeed against the same
// funds, and can never drive availableBalance negative.
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

    const shop = await ShopModel.findOneAndUpdate(
      { _id: seller._id, availableBalance: { $gte: amount } },
      { $inc: { availableBalance: -amount } },
      { new: true }
    );

    if (!shop) {
      const existingShop = await ShopModel.findById(seller._id).select("availableBalance");
      if (!existingShop) {
        return next(new ErrorHandler("Shop not found", 404));
      }
      return next(
        new ErrorHandler(
          `Insufficient balance. Available balance is $${(existingShop.availableBalance || 0).toFixed(2)}`,
          400
        )
      );
    }

    let withdraw;
    try {
      withdraw = await WithdrawModel.create({
        shopId: shop._id,
        seller,
        amount,
      });
    } catch (error) {
      // Compensate the reservation if the withdraw record couldn't be created
      await ShopModel.findByIdAndUpdate(shop._id, { $inc: { availableBalance: amount } });
      throw error;
    }

    try {
      await sendEmail({
        email: seller.email,
        subject: "Withdraw Request",
        message: `Hello ${seller.name}, Your withdraw request of $${amount} is processing. It will take 3 to 7 days to process!`,
      });
    } catch {
      // Best-effort notification; the withdraw request itself already succeeded
    }

    res.status(201).json({
      success: true,
      withdraw,
    });
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
    const { sellerId } = req.body;
    const withdrawId = req.params.id as string;

    const withdraw = await WithdrawModel.findByIdAndUpdate(
      withdrawId,
      {
        status: "succeed",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!withdraw) {
      return next(new ErrorHandler("Withdraw request not found", 404));
    }

    const seller = await ShopModel.findById(sellerId);

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