import mongoose, { Document, Schema, Model } from "mongoose";

export interface IImage {
  public_id: string;
  url: string;
}

export interface IReview {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | object;
  rating: number;
  comment?: string;
  productId: mongoose.Types.ObjectId | string;
  createdAt?: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: IImage[];
  reviews?: IReview[];
  ratings?: number;
  shopId: mongoose.Types.ObjectId;
  shop?: mongoose.Types.ObjectId | object;
  sold_out?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Please enter your product name!"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please enter your product description!"],
    },
    category: {
      type: String,
      required: [true, "Please enter your product category!"],
    },
    tags: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    discountPrice: {
      type: Number,
      required: [true, "Please enter your product price!"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter your product stock!"],
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    reviews: [
      {
        user: {
          type: Schema.Types.Mixed,
        },
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
        productId: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    ratings: {
      type: Number,
      default: 0,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    shop: {
      type: Schema.Types.Mixed,
    },
    sold_out: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ shopId: 1 });
productSchema.index({ category: 1 });

const ProductModel: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);

export default ProductModel;