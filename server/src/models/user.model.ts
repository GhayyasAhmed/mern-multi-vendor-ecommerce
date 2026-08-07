import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IAddress {
  country?: string;
  city?: string;
  address1?: string;
  address2?: string;
  zipCode?: number;
  addressType?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber?: number;
  addresses?: IAddress[];
  avatar?: {
    public_id?: string;
    url?: string;
  };
  wishlist?: mongoose.Types.ObjectId[];
  role: string;
  resetPasswordToken?: string;
  resetPasswordTime?: Date;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
}

const transformUser = (_doc: any, ret: any) => {
  delete ret.password;
  delete ret.resetPasswordToken;
  delete ret.resetPasswordTime;
  return ret;
};

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      minLength: [2, "Name must be at least 2 characters"],
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phoneNumber: {
      type: Number,
    },
    addresses: [
      {
        country: { type: String },
        city: { type: String },
        address1: { type: String },
        address2: { type: String },
        zipCode: { type: Number },
        addressType: { type: String },
      },
    ],
    avatar: {
      public_id: { type: String },
      url: { type: String },
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    role: {
      type: String,
      default: "user",
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordTime: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: transformUser },
    toObject: { transform: transformUser },
  }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(this.password);

  if (!isBcryptHash) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.getJwtToken = function (): string {
  const secret = env.jwtSecretKey as jwt.Secret;
  const expiresIn = process.env.JWT_EXPIRES || "5";

  return jwt.sign({ id: this._id }, secret, {
    expiresIn: (expiresIn + "m")as any,
  });
};

// Sign access token
userSchema.methods.signAccessToken = function (): string {
  return jwt.sign({ id: this._id }, env.accessTokenSecret, {
    expiresIn: "2h",
  });
};

// Sign refresh token
userSchema.methods.signRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, env.refreshTokenSecret, {
    expiresIn: "24h",
  });
};

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default UserModel;