import mongoose, { Document, Schema } from "mongoose";

export interface IWithdraw extends Document {
  seller: object;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}

const withdrawSchema: Schema<IWithdraw> = new mongoose.Schema(
  {
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
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const WithdrawModel = mongoose.model<IWithdraw>("Withdraw", withdrawSchema);

export default WithdrawModel;