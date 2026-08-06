import * as z from "zod";

export const shopLoginSchema = z.object({
  email: z.string("Email is required").email("Invalid email address"),
  password: z.string("Password is required").min(1, "Password is required"),
});
export type ShopLoginFormValues = z.infer<typeof shopLoginSchema>;

export const shopRegisterSchema = z
  .object({
    name: z.string("Shop name is required").min(2, "Shop name must be at least 2 characters"),
    email: z.string("Email is required").email("Invalid email address"),
    password: z.string("Password is required").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string("Confirm password is required"),
    address: z.string("Address is required").min(1, "Address is required"),
    phoneNumber: z.string("Phone number is required").min(1, "Phone number is required"),
    zipCode: z.string("Zip code is required").min(1, "Zip code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ShopRegisterFormValues = z.infer<typeof shopRegisterSchema>;

export const productFormSchema = z.object({
  name: z.string("Product name is required").min(1, "Product name is required"),
  description: z.string("Description is required").min(1, "Description is required"),
  category: z.string("Category is required").min(1, "Category is required"),
  tags: z.string().optional(),
  originalPrice: z.string().optional(),
  discountPrice: z.string("Price is required").min(1, "Price is required"),
  stock: z.string("Stock is required").min(1, "Stock is required"),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const eventFormSchema = z.object({
  name: z.string("Event name is required").min(1, "Event name is required"),
  description: z.string("Description is required").min(1, "Description is required"),
  category: z.string("Category is required").min(1, "Category is required"),
  tags: z.string().optional(),
  originalPrice: z.string().optional(),
  discountPrice: z.string("Price is required").min(1, "Price is required"),
  stock: z.string("Stock is required").min(1, "Stock is required"),
  start_Date: z.string("Start date is required").min(1, "Start date is required"),
  Finish_Date: z.string("Finish date is required").min(1, "Finish date is required"),
});
export type EventFormValues = z.infer<typeof eventFormSchema>;