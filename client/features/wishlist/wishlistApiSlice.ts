import { apiSlice } from "@/lib/api/apiSlice";
import type { IProduct } from "@/types";

export interface GetWishlistResponse {
  success: boolean;
  products: IProduct[];
}

export interface ApiSuccessMessage {
  success: boolean;
  message: string;
}

export const wishlistApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query<GetWishlistResponse, void>({
      query: () => ({
        url: "/user/wishlist",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.products.map((p) => ({ type: "Wishlist" as const, id: p._id })),
              { type: "Wishlist" as const, id: "LIST" },
            ]
          : [{ type: "Wishlist" as const, id: "LIST" }],
    }),

    addToWishlist: builder.mutation<ApiSuccessMessage, string>({
      query: (productId) => ({
        url: `/user/wishlist/${productId}`,
        method: "PUT",
      }),
      invalidatesTags: (result) => result ? [{ type: "Wishlist", id: "LIST" }, "User"] : [],
    }),

    removeFromWishlist: builder.mutation<ApiSuccessMessage, string>({
      query: (productId) => ({
        url: `/user/wishlist/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => result ? [{ type: "Wishlist", id: "LIST" }, "User"] : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = wishlistApiSlice;