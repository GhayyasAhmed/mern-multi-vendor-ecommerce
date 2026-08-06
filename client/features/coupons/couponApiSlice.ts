import { apiSlice } from "@/lib/api/apiSlice";

export interface ValidateCouponRequest {
  name: string;
  shopId: string;
  subtotal: number;
  productIds?: string[];
}

export interface ValidateCouponResponse {
  success: boolean;
  discountAmount: number;
  finalAmount: number;
  coupon: { name: string; value: number };
}

export const couponApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    validateCoupon: builder.mutation<ValidateCouponResponse, ValidateCouponRequest>({
      query: (body) => ({
        url: "/coupon-code/validate-coupon",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useValidateCouponMutation } = couponApiSlice;