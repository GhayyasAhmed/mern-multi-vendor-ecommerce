import * as z from "zod";

export const loginSchema = z.object({
  email: z.string("Email is required").email("Invalid email address"),
  password: z.string("Password is required").min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: z.string("Email is required").email("Invalid email address"),
    password: z.string("Password is required").min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string("Email is required").email("Invalid email address"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string("Password is required").min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  name: z.string("Name is required").min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z.string().optional(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;


export const addressSchema = z.object({
  addressType: z.string("Address label is required").min(1, "Address label is required"),
  country: z.string("Country is required").min(1, "Country is required"),
  city: z.string("City is required").min(1, "City is required"),
  address1: z.string("Address is required").min(3, "Please enter your street address"),
  address2: z.string().optional(),
  zipCode: z.string("Zip code is required").min(1, "Zip code is required"),
});
export type AddressFormValues = z.infer<typeof addressSchema>;

export const passwordChangeSchema = z
  .object({
    oldPassword: z.string("Current password is required").min(1, "Current password is required"),
    newPassword: z.string("New password is required").min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string("Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;