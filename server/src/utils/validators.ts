import * as z from 'zod';

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

export const UserValidations = {
  createUserSchema,
  loginUserSchema,
  updateUserInfoSchema,
  updateUserAvatarSchema,
  updateUserAddressesSchema,
  updateUserPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};