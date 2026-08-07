import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import WithdrawModel from "../models/withdraw.model.js";
import ShopModel from "../models/shop.model.js";
import sendEmail from "../utils/sendEmail.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js"

// create withdraw request --- only for seller
export const createWithdrawRequest = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { amount } = req.body;
    const seller = req.seller;

    if (!seller) {
      return next(new ErrorHandler("Seller not found in request", 400));
    }

    const data = {
      seller,
      amount,
    };

    await sendEmail({
      email: seller.email,
      subject: "Withdraw Request",
      message: `Hello ${seller.name}, Your withdraw request of ${amount}$ is processing. It will take 3days to 7days to processing! `,
    });

    const withdraw = await WithdrawModel.create(data);

    const shop = await ShopModel.findById(seller._id);

    if (!shop) {
      return next(new ErrorHandler("Shop not found", 404));
    }

    shop.availableBalance = (shop.availableBalance || 0) - amount;

    await shop.save();

    res.status(201).json({
      success: true,
      withdraw,
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