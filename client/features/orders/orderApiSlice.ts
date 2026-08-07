import { apiSlice } from "@/lib/api/apiSlice";

export interface OrderCartItem {
  _id: string;
  shopId: string;
  qty: number;
  kind?: "product" | "event";
  name?: string;
  discountPrice?: number;
  images?: { url: string }[];
  [key: string]: unknown;
}

export interface OrderShippingAddress {
  country?: string;
  city?: string;
  address1?: string;
  address2?: string;
  zipCode?: number | string;
  addressType?: string;
}

export interface OrderCoupon {
  name: string;
  discountAmount: number;
}

export interface IOrder {
  _id: string;
  cart: OrderCartItem[];
  shippingAddress: OrderShippingAddress;
  user: { _id: string; name?: string; email?: string };
  totalPrice: number;
  status: string;
  paymentInfo?: { id?: string; status?: string; type?: string };
  coupon?: OrderCoupon;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  cart: { _id: string; shopId: string; qty: number; kind?: "product" | "event"; name?: string; discountPrice?: number; images?: { url: string }[] }[];
  shippingAddress: OrderShippingAddress;
  paymentInfo?: { id?: string; status?: string; type?: string };
  couponCode?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orders: IOrder[];
}

export interface OrdersPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface GetOrdersParams {
  id: string;
  page?: number;
  limit?: number;
}

export interface GetOrdersResponse {
  success: boolean;
  orders: IOrder[];
  pagination: OrdersPagination;
}

export interface GetOrderResponse {
  success: boolean;
  order: IOrder;
}

export interface UpdateOrderStatusRequest {
  id: string;
  shopId?: string;
  status: string;
}

export interface OrderActionResponse {
  success: boolean;
  order?: IOrder;
  message?: string;
}

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: "/order/create-order",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),

    getMyOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      query: ({ id, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return {
          url: `/order/get-all-orders/${id}${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.orders.map((o) => ({ type: "Order" as const, id: o._id })),
            { type: "Order" as const, id: "LIST" },
          ]
          : [{ type: "Order" as const, id: "LIST" }],
    }),

    getSellerOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      query: ({ id, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return {
          url: `/order/get-seller-all-orders/${id}${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.orders.map((o) => ({ type: "Order" as const, id: o._id })),
            { type: "Order" as const, id: "SELLER-LIST" },
          ]
          : [{ type: "Order" as const, id: "SELLER-LIST" }],
    }),

    updateOrderStatus: builder.mutation<OrderActionResponse, UpdateOrderStatusRequest>({
      query: ({ id, status }) => ({
        url: `/order/update-order-status/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "SELLER-LIST" },
        { type: "Order", id: "LIST" },
      ],
    }),

    orderRefundSuccess: builder.mutation<OrderActionResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/order/order-refund-success/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "SELLER-LIST" },
        { type: "Order", id: "LIST" },
      ],
    }),

    getOrderById: builder.query<GetOrderResponse, string>({
      query: (id) => ({
        url: `/order/get-order/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),

    requestOrderRefund: builder.mutation<OrderActionResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/order/order-refund/${id}`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useOrderRefundSuccessMutation,
  useRequestOrderRefundMutation,
  useGetOrderByIdQuery,
} = orderApiSlice;

