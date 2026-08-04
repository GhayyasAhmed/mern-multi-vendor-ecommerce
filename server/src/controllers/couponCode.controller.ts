import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import CouponCodeModel from "../models/couponCode.model.js";

// create coupon code
export const createCouponCode = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isCouponCodeExists = await CouponCodeModel.findOne({
        name: req.body.name,
      });

      if (isCouponCodeExists) {
        return next(new ErrorHandler("Coupon code already exists!", 400));
      }

      const couponCode = await CouponCodeModel.create(req.body);

      res.status(201).json({
        success: true,
        couponCode,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get all coupons of a shop
export const getShopCoupons = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = req.seller?._id
        ? String(req.seller._id)
        : req.params.id;

      const couponCodes = await CouponCodeModel.find({ shopId });

      res.status(201).json({
        success: true,
        couponCodes,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// delete coupon code of a shop
export const deleteCouponCode = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const couponCode = await CouponCodeModel.findByIdAndDelete(req.params.id);

      if (!couponCode) {
        return next(new ErrorHandler("Coupon code doesn't exist!", 400));
      }

      res.status(201).json({
        success: true,
        message: "Coupon code deleted successfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);

// get coupon code value by its name
export const getCouponValueByName = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const couponCode = await CouponCodeModel.findOne({ name: req.params.name });

      res.status(200).json({
        success: true,
        couponCode,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return next(new ErrorHandler(message, 400));
    }
  }
);