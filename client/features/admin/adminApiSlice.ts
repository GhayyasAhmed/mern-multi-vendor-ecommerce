import { apiSlice } from "@/lib/api/apiSlice";
import type { IUser, IShop, IProduct } from "@/types";
import type { IEvent } from "@/features/events/eventApiSlice";
import type { IOrder } from "@/features/orders/orderApiSlice";

export interface AdminUsersResponse {
  success: boolean;
  users: IUser[];
}

export interface AdminSellersResponse {
  success: boolean;
  sellers: IShop[];
}

export interface AdminProductsResponse {
  success: boolean;
  products: IProduct[];
}

export interface AdminEventsResponse {
  success: boolean;
  events: IEvent[];
}

export interface AdminOrdersResponse {
  success: boolean;
  orders: IOrder[];
}

export interface IWithdrawRequest {
  _id: string;
  seller: { _id: string; name: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminWithdrawsResponse {
  success: boolean;
  withdraws: IWithdrawRequest[];
}

export interface ApiSuccessMessage {
  success: boolean;
  message: string;
}

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsersAdmin: builder.query<AdminUsersResponse, void>({
      query: () => ({ url: "/user/admin-all-users", method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map((u) => ({ type: "User" as const, id: u._id })),
              { type: "User" as const, id: "ADMIN-LIST" },
            ]
          : [{ type: "User" as const, id: "ADMIN-LIST" }],
    }),

    deleteUserAdmin: builder.mutation<ApiSuccessMessage, string>({
      query: (id) => ({ url: `/user/delete-user/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "ADMIN-LIST" }],
    }),

    getAllSellersAdmin: builder.query<AdminSellersResponse, void>({
      query: () => ({ url: "/shop/admin-all-sellers", method: "GET" }),
      providesTags: [{ type: "Shop", id: "ADMIN-LIST" }],
    }),

    deleteSellerAdmin: builder.mutation<ApiSuccessMessage, string>({
      query: (id) => ({ url: `/shop/delete-seller/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Shop", id: "ADMIN-LIST" }],
    }),

    getAllProductsAdmin: builder.query<AdminProductsResponse, void>({
      query: () => ({ url: "/product/admin-all-products", method: "GET" }),
      providesTags: [{ type: "Product", id: "ADMIN-LIST" }],
    }),

    getAllEventsAdmin: builder.query<AdminEventsResponse, void>({
      query: () => ({ url: "/event/admin-all-events", method: "GET" }),
      providesTags: [{ type: "Event", id: "ADMIN-LIST" }],
    }),

    getAllOrdersAdmin: builder.query<AdminOrdersResponse, void>({
      query: () => ({ url: "/order/admin-all-orders", method: "GET" }),
      providesTags: [{ type: "Order", id: "ADMIN-LIST" }],
    }),

    getAllWithdrawsAdmin: builder.query<AdminWithdrawsResponse, void>({
      query: () => ({ url: "/withdraw/get-all-withdraw-request", method: "GET" }),
      providesTags: [{ type: "Withdraw", id: "LIST" }],
    }),

    updateWithdrawAdmin: builder.mutation<ApiSuccessMessage, { id: string; sellerId: string }>({
      query: ({ id, sellerId }) => ({
        url: `/withdraw/update-withdraw-request/${id}`,
        method: "PUT",
        body: { sellerId },
      }),
      invalidatesTags: [{ type: "Withdraw", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersAdminQuery,
  useDeleteUserAdminMutation,
  useGetAllSellersAdminQuery,
  useDeleteSellerAdminMutation,
  useGetAllProductsAdminQuery,
  useGetAllEventsAdminQuery,
  useGetAllOrdersAdminQuery,
  useGetAllWithdrawsAdminQuery,
  useUpdateWithdrawAdminMutation,
} = adminApiSlice;