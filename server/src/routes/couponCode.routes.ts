import express from "express";
import {
  createCouponCode,
  getShopCoupons,
  deleteCouponCode,
  getCouponValueByName,
  validateCoupon,
} from "../controllers/couponCode.controller.js";
import { isSeller, isAuthenticated } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { CouponValidations } from "../utils/validators.js";

const couponCodeRouter = express.Router();

couponCodeRouter.post(
  "/create-coupon-code",
  isSeller,
  validate(CouponValidations.createCouponCodeSchema),
  createCouponCode
);
couponCodeRouter.get("/get-coupon/:id", isSeller, getShopCoupons);
couponCodeRouter.delete("/delete-coupon/:id", isSeller, deleteCouponCode);
couponCodeRouter.get("/get-coupon-value/:name", getCouponValueByName);
couponCodeRouter.post(
  "/validate-coupon",
  isAuthenticated,
  validate(CouponValidations.validateCouponSchema),
  validateCoupon
);

export default couponCodeRouter;