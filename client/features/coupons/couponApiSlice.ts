import { apiSlice } from "@/lib/api/apiSlice";

export interface ICoupon {
  _id: string;
  name: string;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  shopId: string;
  selectedProduct?: string;
  createdAt: string;
}

export interface CreateCouponRequest {
  name: string;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  selectedProduct?: string;
}

export interface CreateCouponResponse { success: boolean; couponCode: ICoupon; }
export interface GetShopCouponsResponse {
  success: boolean;
  couponCodes: ICoupon[];
  pagination: { currentPage: number; totalPages: number; totalItems: number; limit: number };
}
export interface DeleteCouponResponse { success: boolean; message: string; }

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
    getShopCoupons: builder.query<GetShopCouponsResponse, { page?: number; limit?: number } | void>({
      query: (params) => {
        const p = new URLSearchParams();
        if (params?.page) p.set("page", String(params.page));
        if (params?.limit) p.set("limit", String(params.limit));
        const qs = p.toString();
        return { url: `/coupon-code/get-coupon${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [...result.couponCodes.map((c) => ({ type: "Coupon" as const, id: c._id })), { type: "Coupon" as const, id: "LIST" }]
          : [{ type: "Coupon" as const, id: "LIST" }],
    }),

    createCouponCode: builder.mutation<CreateCouponResponse, CreateCouponRequest>({
      query: (body) => ({ url: "/coupon-code/create-coupon-code", method: "POST", body }),
      // invalidatesTags: [{ type: "Coupon", id: "LIST" }],
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "Coupon", id: "LIST" }]),
    }),

    deleteCouponCode: builder.mutation<DeleteCouponResponse, string>({
      query: (id) => ({ url: `/coupon-code/delete-coupon/${id}`, method: "DELETE" }),
      // invalidatesTags: [{ type: "Coupon", id: "LIST" }],
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "Coupon", id: "LIST" }]),
    }),
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

export const {
  useValidateCouponMutation,
  useGetShopCouponsQuery,
  useCreateCouponCodeMutation,
  useDeleteCouponCodeMutation,
} = couponApiSlice;