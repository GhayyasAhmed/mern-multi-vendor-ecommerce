import { Request, Response, NextFunction } from "express";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import CouponCodeModel, { ICouponCode } from "../models/couponCode.model.js";

// create coupon code --- always scoped to the authenticated seller's shop,
// regardless of any shopId the client may have sent
export const createCouponCode = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sellerId = req.seller?._id;

    if (!sellerId) {
      return next(new ErrorHandler("Seller not found in request", 400));
    }

    const isCouponCodeExists = await CouponCodeModel.findOne({
      name: req.body.name,
    });

    if (isCouponCodeExists) {
      return next(new ErrorHandler("Coupon code already exists!", 400));
    }

    const couponCode = await CouponCodeModel.create({
      ...req.body,
      shopId: String(sellerId),
    });

    res.status(201).json({
      success: true,
      couponCode,
    });
  }
);

// get all coupons of a shop
export const getShopCoupons = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const shopId = req.seller?._id ? String(req.seller._id) : req.params.id;

    const couponCodes = await CouponCodeModel.find({ shopId });

    res.status(200).json({
      success: true,
      couponCodes,
    });
  }
);

// delete coupon code of a shop --- only the owning seller may delete
export const deleteCouponCode = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const couponCode = await CouponCodeModel.findById(req.params.id);

    if (!couponCode) {
      return next(new ErrorHandler("Coupon code doesn't exist!", 404));
    }

    if (String(couponCode.shopId) !== String(req.seller?._id)) {
      return next(new ErrorHandler("You are not authorized to delete this coupon", 403));
    }

    await CouponCodeModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Coupon code deleted successfully!",
    });
  }
);

// get coupon code by its name (simple public lookup, no discount calculation)
export const getCouponValueByName = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const couponCode = await CouponCodeModel.findOne({ name: req.params.name });

    if (!couponCode) {
      return next(new ErrorHandler("Coupon code doesn't exist!", 404));
    }

    res.status(200).json({
      success: true,
      couponCode,
    });
  }
);

export const calculateCouponDiscount = (
  coupon: ICouponCode,
  subtotal: number,
  cartProductIds: string[]
): { valid: boolean; reason?: string; discountAmount: number } => {
  if (coupon.minAmount != null && subtotal < coupon.minAmount) {
    return { valid: false, reason: `Minimum order amount is $${coupon.minAmount}`, discountAmount: 0 };
  }

  if (coupon.maxAmount != null && subtotal > coupon.maxAmount) {
    return { valid: false, reason: `Coupon is only valid for orders up to $${coupon.maxAmount}`, discountAmount: 0 };
  }

  if (coupon.selectedProduct && !cartProductIds.includes(String(coupon.selectedProduct))) {
    return { valid: false, reason: "Coupon does not apply to the items in your cart", discountAmount: 0 };
  }

  const discountAmount = Math.round(((subtotal * coupon.value) / 100) * 100) / 100;
  return { valid: true, discountAmount };
};

// validate a coupon against a shop's cart subtotal --- used at checkout
export const validateCoupon = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, shopId, subtotal, productIds } = req.body as {
      name: string;
      shopId: string;
      subtotal: number;
      productIds?: string[];
    };

    const coupon = await CouponCodeModel.findOne({ name });

    if (!coupon) {
      return next(new ErrorHandler("Invalid coupon code", 404));
    }

    if (String(coupon.shopId) !== String(shopId)) {
      return next(new ErrorHandler("This coupon is not valid for this shop", 400));
    }

    const result = calculateCouponDiscount(coupon, subtotal, productIds || []);

    if (!result.valid) {
      return next(new ErrorHandler(result.reason || "Coupon is not valid for this order", 400));
    }

    res.status(200).json({
      success: true,
      discountAmount: result.discountAmount,
      finalAmount: Math.max(subtotal - result.discountAmount, 0),
      coupon: {
        name: coupon.name,
        value: coupon.value,
      },
    });
  }
);