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

export const ShopValidations = {
  createShopSchema,
  loginShopSchema,
  updateSellerInfoSchema,
  updatePaymentMethodsSchema,
};