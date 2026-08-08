
import { apiSlice } from "@/lib/api/apiSlice";
import type { IUser, IShop, IProduct } from "@/types";
import type { IEvent } from "@/features/events/eventApiSlice";
import type { IOrder } from "@/features/orders/orderApiSlice";

export interface AdminPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface AdminPageParams {
  page?: number;
  limit?: number;
}

function buildAdminQueryString(params: AdminPageParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export interface AdminUsersResponse {
  success: boolean;
  users: IUser[];
  pagination: AdminPagination;
}

export interface AdminSellersResponse {
  success: boolean;
  sellers: IShop[];
  pagination: AdminPagination;
}

export interface AdminProductsResponse {
  success: boolean;
  products: IProduct[];
  pagination: AdminPagination;
}

export interface AdminEventsResponse {
  success: boolean;
  events: IEvent[];
  pagination: AdminPagination;
}

export interface AdminOrdersResponse {
  success: boolean;
  orders: IOrder[];
  pagination: AdminPagination;
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
  pagination: AdminPagination;
}

export interface AdminStats {
  userCount: number;
  sellerCount: number;
  productCount: number;
  eventCount: number;
  orderCount: number;
  pendingWithdrawCount: number;
}

export interface AdminStatsResponse {
  success: boolean;
  stats: AdminStats;
}

export interface ApiSuccessMessage {
  success: boolean;
  message: string;
}

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStatsResponse, void>({
      query: () => ({ url: "/admin/stats", method: "GET" }),
      // providesTags: ["User", "Shop", "Product", "Event", "Order", "Withdraw"],
      providesTags: [{ type: "AdminStats", id: "OVERVIEW" }],
      keepUnusedDataFor: 30,
    }),

    getAllUsersAdmin: builder.query<AdminUsersResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/user/admin-all-users${buildAdminQueryString(params ?? {})}`, method: "GET" }),
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
      // invalidatesTags: [{ type: "User", id: "ADMIN-LIST" }],
      invalidatesTags: [
        { type: "User", id: "ADMIN-LIST" },
        { type: "AdminStats", id: "OVERVIEW" },
      ],
    }),

    getAllSellersAdmin: builder.query<AdminSellersResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/shop/admin-all-sellers${buildAdminQueryString(params ?? {})}`, method: "GET" }),
      providesTags: [{ type: "Shop", id: "ADMIN-LIST" }],
    }),

    deleteSellerAdmin: builder.mutation<ApiSuccessMessage, string>({
      query: (id) => ({ url: `/shop/delete-seller/${id}`, method: "DELETE" }),
      // invalidatesTags: [{ type: "Shop", id: "ADMIN-LIST" }],
      invalidatesTags: [
        { type: "Shop", id: "ADMIN-LIST" },
        { type: "AdminStats", id: "OVERVIEW" },
      ],
    }),

    getAllProductsAdmin: builder.query<AdminProductsResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/product/admin-all-products${buildAdminQueryString(params ?? {})}`, method: "GET" }),
      providesTags: [{ type: "Product", id: "ADMIN-LIST" }],
    }),

    getAllEventsAdmin: builder.query<AdminEventsResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/event/admin-all-events${buildAdminQueryString(params ?? {})}`, method: "GET" }),
      providesTags: [{ type: "Event", id: "ADMIN-LIST" }],
    }),

    getAllOrdersAdmin: builder.query<AdminOrdersResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/order/admin-all-orders${buildAdminQueryString(params ?? {})}`, method: "GET" }),
      providesTags: [{ type: "Order", id: "ADMIN-LIST" }],
    }),

    getAllWithdrawsAdmin: builder.query<AdminWithdrawsResponse, AdminPageParams | void>({
      query: (params) => ({ url: `/withdraw/get-all-withdraw-request${buildAdminQueryString(params ?? {})}`, method: "GET" }),
      providesTags: [{ type: "Withdraw", id: "LIST" }],
    }),

    updateWithdrawAdmin: builder.mutation<ApiSuccessMessage, { id: string; sellerId: string }>({
      query: ({ id, sellerId }) => ({
        url: `/withdraw/update-withdraw-request/${id}`,
        method: "PUT",
        body: { sellerId },
      }),
      // invalidatesTags: [{ type: "Withdraw", id: "LIST" }],
      invalidatesTags: [
        { type: "Withdraw", id: "LIST" },
        { type: "AdminStats", id: "OVERVIEW" },
      ],
    }),

    rejectWithdrawAdmin: builder.mutation<ApiSuccessMessage, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/withdraw/reject-withdraw-request/${id}`,
        method: "PUT",
        body: { reason },
      }),
      // invalidatesTags: [{ type: "Withdraw", id: "LIST" }],
      invalidatesTags: [
        { type: "Withdraw", id: "LIST" },
        { type: "AdminStats", id: "OVERVIEW" },
      ],
    }),

    updateSellerStatusAdmin: builder.mutation<ApiSuccessMessage, { id: string; status: "pending" | "active" | "suspended" }>({
      query: ({ id, status }) => ({ url: `/shop/admin-update-status/${id}`, method: "PUT", body: { status } }),
      // invalidatesTags: [{ type: "Shop", id: "ADMIN-LIST" }],
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Shop", id: "ADMIN-LIST" },
        { type: "Shop", id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminStatsQuery,
  useGetAllUsersAdminQuery,
  useDeleteUserAdminMutation,
  useGetAllSellersAdminQuery,
  useDeleteSellerAdminMutation,
  useGetAllProductsAdminQuery,
  useGetAllEventsAdminQuery,
  useGetAllOrdersAdminQuery,
  useGetAllWithdrawsAdminQuery,
  useUpdateWithdrawAdminMutation,
  useRejectWithdrawAdminMutation,
  useUpdateSellerStatusAdminMutation
} = adminApiSlice;