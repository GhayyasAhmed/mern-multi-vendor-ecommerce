import mongoose, { Document, Schema, Model } from "mongoose";

export interface IShippingAddress {
  country?: string;
  city?: string;
  address1?: string;
  address2?: string;
  zipCode?: number;
  addressType?: string;
}

export interface IPaymentInfo {
  id?: string;
  status?: string;
  type?: string;
}

export interface IOrderCoupon {
  name: string;
  discountAmount: number;
}

export interface IOrder extends Document {
  cart: Array<object>;
  shippingAddress: IShippingAddress;
  user: mongoose.Types.ObjectId | object;
  totalPrice: number;
  status: string;
  paymentInfo?: IPaymentInfo;
  coupon?: IOrderCoupon;
  paidAt?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    cart: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    shippingAddress: {
      type: Schema.Types.Mixed,
      required: true,
    },
    user: {
      type: Schema.Types.Mixed,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Processing",
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
      },
      type: {
        type: String,
      },
    },
    coupon: {
      name: { type: String },
      discountAmount: { type: Number },
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ "user._id": 1 });
orderSchema.index({ "cart.shopId": 1 });

const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;