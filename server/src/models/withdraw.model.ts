import mongoose, { Document, Schema } from "mongoose";

export interface IWithdraw extends Document {
  shopId: mongoose.Types.ObjectId;
  seller: object;
  amount: number;
  status: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const withdrawSchema: Schema<IWithdraw> = new mongoose.Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop id is required!"],
    },
    seller: {
      type: Object,
      required: [true, "Seller is required!"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required!"],
    },
    status: {
      type: String,
      default: "Processing",
    },
    rejectionReason: {
      type: String,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

withdrawSchema.index({ shopId: 1 });

const WithdrawModel = mongoose.model<IWithdraw>("Withdraw", withdrawSchema);

export default WithdrawModel;