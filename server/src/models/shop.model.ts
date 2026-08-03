import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Document, Schema, model } from 'mongoose';
import { env } from '../config/env.js';

export interface IWithdrawMethod {
    withdrawMethodName: string;
    bankName: string;
    bankCountry: string;
    bankSwiftCode?: string;
    bankAccountNumber: number | string;
    bankHolderName: string;
    bankAddress?: string;
}

export interface IShop extends Document {
    name: string;
    email: string;
    password?: string;
    description?: string;
    address: string;
    phoneNumber: number;
    role: 'Seller';
    avatar: {
        public_id: string;
        url: string;
    };
    zipCode: number;
    withdrawMethod?: IWithdrawMethod;
    availableBalance: number;
    transaction?: Array<{
        amount: number;
        status: string;
        createdAt?: Date;
        updatedAt?: Date;
    }>;
    resetPasswordToken?: string;
    resetPasswordTime?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getJwtToken: () => string;
    signAccessToken: () => string;
    signRefreshToken: () => string;
}

export interface IShopActivationTokenPayload {
    name: string;
    email: string;
    password?: string;
    avatar: {
        public_id: string;
        url: string;
    };
    zipCode: number;
    address: string;
    phoneNumber: number;
}

const withdrawMethodSchema = new Schema(
    {
        withdrawMethodName: { type: String, required: true },
        bankName: { type: String, required: true },
        bankCountry: { type: String, required: true },
        bankSwiftCode: { type: String },
        bankAccountNumber: { type: Schema.Types.Mixed, required: true },
        bankHolderName: { type: String, required: true },
        bankAddress: { type: String },
    },
    { _id: false }
);

const transformShop = (_doc: any, ret: any) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordTime;
    return ret;
};

const shopSchema = new Schema<IShop>(
    {
        name: {
            type: String,
            required: [true, 'Please enter your shop name!'],
        },
        email: {
            type: String,
            required: [true, 'Please enter your shop email address!'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Please enter your password!'],
            minLength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        description: {
            type: String,
        },
        address: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: Number,
            required: true,
        },
        role: {
            type: String,
            default: 'Seller',
        },
        avatar: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        zipCode: {
            type: Number,
            required: true,
        },
        withdrawMethod: {
            type: withdrawMethodSchema,
            default: null,
        },
        availableBalance: {
            type: Number,
            default: 0,
        },
        transaction: [
            {
                amount: { type: Number, required: true },
                status: { type: String, default: 'Processing' },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date },
            },
        ],
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
        toJSON: { transform: transformShop },
        toObject: { transform: transformShop },
    }
);

shopSchema.pre<IShop>('save', async function () {
    if (!this.password || !this.isModified("password")) {
        return;
    }

    const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(this.password);

    if (!isBcryptHash) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

shopSchema.methods.signAccessToken = function (): string {
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRE || "5m";

    return jwt.sign({ id: this._id, role: this.role }, env.accessTokenSecret, {
        expiresIn: expiresIn as any,
    });
};

shopSchema.methods.signRefreshToken = function (): string {
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRE || "3d";

    return jwt.sign({ id: this._id }, env.refreshTokenSecret, {
        expiresIn: expiresIn as any,
    });
};

shopSchema.methods.getJwtToken = function (): string {
    const expiresIn = process.env.JWT_EXPIRES || "7d";

    return jwt.sign({ id: this._id }, env.jwtSecretKey, {
        expiresIn: expiresIn as any,
    });
};

shopSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
};

const ShopModel = model<IShop>('Shop', shopSchema);

export default ShopModel;