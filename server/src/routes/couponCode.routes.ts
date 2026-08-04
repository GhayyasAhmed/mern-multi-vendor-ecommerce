import express from "express";
import {
  createCouponCode,
  getShopCoupons,
  deleteCouponCode,
  getCouponValueByName,
} from "../controllers/couponCode.controller.js";
import { isSeller } from "../middlewares/auth.js";

const couponCodeRouter = express.Router();

couponCodeRouter.post("/create-coupon-code", isSeller, createCouponCode);
couponCodeRouter.get("/get-coupon/:id", isSeller, getShopCoupons);
couponCodeRouter.delete("/delete-coupon/:id", isSeller, deleteCouponCode);
couponCodeRouter.get("/get-coupon-value/:name", getCouponValueByName);

export default couponCodeRouter;