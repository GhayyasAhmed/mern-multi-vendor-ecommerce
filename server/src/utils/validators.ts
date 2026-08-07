import * as z from 'zod';
import { PRODUCT_CATEGORIES } from '../constants/categories.js';

const createShopSchema = z.object({
  body: z.object({
    name: z.string('Shop name is required'),
    email: z.string('Email is required').email('Invalid email address'),
    password: z.string('Password is required').min(6, 'Password must be at least 6 characters'),
    address: z.string('Address is required'),
    phoneNumber: z.number({ message: 'Phone number is required' }),
    zipCode: z.number({ message: 'Zip code is required' }),
    avatar: z.string('Avatar image is required'),
  }),
});

const loginShopSchema = z.object({
  body: z.object({
    email: z.string('Email is required').email('Invalid email address'),
    password: z.string('Password is required'),
  }),
});

const updateSellerInfoSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.number().optional(),
    zipCode: z.number().optional(),
  }),
});

const updatePaymentMethodsSchema = z.object({
  body: z.object({
    withdrawMethod: z.object({
      withdrawMethodName: z.string('Withdraw method name is required'),
      bankName: z.string('Bank name is required'),
      bankCountry: z.string('Bank country is required'),
      bankSwiftCode: z.string().optional(),
      bankAccountNumber: z.union([z.string(), z.number()]),
      bankHolderName: z.string('Bank holder name is required'),
      bankAddress: z.string().optional(),
    }),
  }),
});

const updateShopAvatarSchema = z.object({
  body: z.object({
    avatar: z.string().optional(),
  }),
});

export const ShopValidations = {
  createShopSchema,
  loginShopSchema,
  updateSellerInfoSchema,
  updatePaymentMethodsSchema,
  updateShopAvatarSchema,
};

// Shared by both /shop/activation and /user/activation (identical payload shape)
export const activationSchema = z.object({
  body: z.object({
    activation_token: z.string('Activation token is required'),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    name: z.string('Name is required'),
    email: z.string('Email is required').email('Invalid email address'),
    password: z.string('Password is required').min(8, 'Password must be at least 8 characters'),
    avatar: z.string().optional(),
  }),
});

const loginUserSchema = z.object({
  body: z.object({
    email: z.string('Email is required').email('Invalid email address'),
    password: z.string('Password is required'),
  }),
});

const updateUserInfoSchema = z.object({
  body: z.object({
    email: z.string('Email is required').email('Invalid email address'),
    password: z.string('Password is required'),
    name: z.string().optional(),
    phoneNumber: z.number().optional(),
  }),
});

const updateUserAvatarSchema = z.object({
  body: z.object({
    avatar: z.string('Avatar is required'),
  }),
});

const updateUserAddressesSchema = z.object({
  body: z.object({
    _id: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    zipCode: z.number().optional(),
    addressType: z.string('Address type is required'),
  }),
});

const updateUserPasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string('Old password is required'),
    newPassword: z.string('New password is required').min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string('Confirm password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string('Email is required').email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string('Reset token is required'),
  }),
  body: z.object({
    password: z.string('Password is required').min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string('Confirm password is required'),
  }),
});


const updateUserProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        phoneNumber: z.number().optional(),
    }),
});

const updateUserEmailSchema = z.object({
    body: z.object({
        email: z.string('Email is required').email('Invalid email address'),
        password: z.string('Password is required'),
    }),
});

// Helper for validating product and event images with a max limit of 8
const imageListValidation = z.union([
  z.string(),
  z.array(z.string()).min(1, 'At least one image is required').max(8, 'Maximum 8 images allowed'),
]);

const createProductSchema = z.object({
  body: z.object({
    name: z.string('Please enter your product name!'),
    description: z.string('Please enter your product description!'),
    category: z.enum(PRODUCT_CATEGORIES, { message: 'Please select a valid product category!' }),
    tags: z.string().optional(),
    originalPrice: z.number().optional(),
    discountPrice: z.number({ message: 'Please enter your product price!' }),
    stock: z.number({ message: 'Please enter your product stock!' }),
    images: imageListValidation,
    shopId: z.string().optional(),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string('Product id is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(PRODUCT_CATEGORIES, { message: 'Please select a valid product category!' }).optional(),
    tags: z.string().optional(),
    originalPrice: z.number().optional(),
    discountPrice: z.number().optional(),
    stock: z.number().optional(),
    images: imageListValidation.optional(),
  }),
});

const checkAvailabilitySchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          _id: z.string('Product id is required'),
          kind: z.enum(['product', 'event']).optional(),
        })
      )
      .min(1, 'At least one item is required')
      .max(100, 'Too many items'),
  }),
});


const createReviewSchema = z.object({
  body: z.object({
    user: z.union([z.string(), z.record(z.string(), z.unknown())]),
    rating: z.number({ message: 'Rating is required' }).min(1).max(5),
    comment: z.string().optional(),
    productId: z.string('Product id is required'),
    orderId: z.string('Order id is required'),
  }),
});

export const ProductValidations = {
  createProductSchema,
  createReviewSchema,
  updateProductSchema,
  checkAvailabilitySchema,
};

export const UserValidations = {
    createUserSchema,
    loginUserSchema,
    updateUserProfileSchema,
    updateUserEmailSchema,
    updateUserAvatarSchema,
    updateUserAddressesSchema,
    updateUserPasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};

// ---- Order Validations ----
const cartItemSchema = z.object({
  _id: z.string('Product id is required'),
  shopId: z.string('Shop id is required'),
  qty: z.number({ message: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
  kind: z.enum(['product', 'event']).optional(),
  name: z.string().optional(),
  discountPrice: z.number().optional(),
  images: z.array(z.object({ url: z.string() })).optional(),
});

const shippingAddressSchema = z.object({
  address1: z.string('Street address is required').min(1, 'Street address is required'),
  address2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.union([z.string(), z.number()]).optional(),
  addressType: z.string().optional(),
});

const createOrderSchema = z.object({
  body: z.object({
    cart: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
    shippingAddress: shippingAddressSchema,
    paymentInfo: z
      .object({
        id: z.string().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
    couponCode: z.string().optional(),
  }),
});

const ORDER_STATUSES = [
  'Processing',
  'Transferred to delivery partner',
  'Shipped',
  'On the way',
  'Delivered',
] as const;

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(ORDER_STATUSES, { message: 'Invalid order status' }),
  }),
});

export const OrderValidations = {
  createOrderSchema,
  updateOrderStatusSchema,
};

// ---- Coupon Validations ----
const createCouponCodeSchema = z.object({
  body: z.object({
    name: z.string('Coupon name is required').min(3, 'Coupon name must be at least 3 characters'),
    value: z.number({ message: 'Discount value is required' }).min(1).max(100),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    selectedProduct: z.string().optional(),
  }),
});

const validateCouponSchema = z.object({
  body: z.object({
    name: z.string('Coupon code is required'),
    shopId: z.string('Shop id is required'),
    subtotal: z.number({ message: 'Subtotal is required' }).min(0),
    productIds: z.array(z.string()).optional(),
  }),
});

export const CouponValidations = {
  createCouponCodeSchema,
  validateCouponSchema,
};

const createEventSchema = z.object({
  body: z
    .object({
      name: z.string('Please enter your event product name!'),
      description: z.string('Please enter your event product description!'),
      category: z.enum(PRODUCT_CATEGORIES, { message: 'Please select a valid product category!' }),
      start_Date: z.union([z.string(), z.date()], { message: 'Please provide a start date' }),
      Finish_Date: z.union([z.string(), z.date()], { message: 'Please provide a finish date' }),
      tags: z.string().optional(),
      originalPrice: z.number().optional(),
      discountPrice: z.number({ message: 'Please enter your event product price!' }),
      stock: z.number({ message: 'Please enter your event product stock!' }),
      images: imageListValidation,
      shopId: z.string().optional(),
    })
    .refine((data) => new Date(data.Finish_Date) > new Date(data.start_Date), {
      message: 'Finish date must be strictly after start date',
      path: ['Finish_Date'],
    }),
});

const updateEventSchema = z.object({
  params: z.object({
    id: z.string('Event id is required'),
  }),
  body: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(PRODUCT_CATEGORIES, { message: 'Please select a valid product category!' }).optional(),
      start_Date: z.union([z.string(), z.date()]).optional(),
      Finish_Date: z.union([z.string(), z.date()]).optional(),
      tags: z.string().optional(),
      originalPrice: z.number().optional(),
      discountPrice: z.number().optional(),
      stock: z.number().optional(),
      images: imageListValidation.optional(),
    })
    .refine(
      (data) =>
        !data.start_Date || !data.Finish_Date || new Date(data.Finish_Date) > new Date(data.start_Date),
      { message: 'Finish date must be strictly after start date', path: ['Finish_Date'] }
    ),
});

export const EventValidations = {
  createEventSchema,
  updateEventSchema,
};

const createConversationSchema = z.object({
  body: z.object({
    sellerId: z.string('Seller id is required'),
  }),
});

const updateLastMessageSchema = z.object({
  body: z.object({
    lastMessage: z.string('Last message is required'),
    lastMessageId: z.string('Last message id is required'),
  }),
});

export const ConversationValidations = {
  createConversationSchema,
  updateLastMessageSchema,
};

const createMessageSchema = z.object({
  body: z
    .object({
      conversationId: z.string('Conversation id is required'),
      text: z.string().optional(),
      images: z.string().optional(),
    })
    .refine((data) => Boolean(data.text?.trim()) || Boolean(data.images), {
      message: 'Message must contain text or an image',
      path: ['text'],
    }),
});

export const MessageValidations = {
  createMessageSchema,
};