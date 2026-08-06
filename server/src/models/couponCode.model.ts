import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICouponCode extends Document {
  name: string;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  shopId: mongoose.Types.ObjectId;
  selectedProduct?: string;
  createdAt: Date;
}

const couponCodeSchema: Schema<ICouponCode> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your coupon code name!"],
    unique: true,
  },
  value: {
    type: Number,
    required: true,
  },
  minAmount: {
    type: Number,
  },
  maxAmount: {
    type: Number,
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  selectedProduct: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

couponCodeSchema.index({ shopId: 1 });

const CouponCodeModel: Model<ICouponCode> = mongoose.model<ICouponCode>(
  "CouponCode",
  couponCodeSchema
);

export default CouponCodeModel;