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

export interface GetOrdersResponse {
  success: boolean;
  orders: IOrder[];
}

export interface GetOrderResponse {
  success: boolean;
  order: IOrder;
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

    getMyOrders: builder.query<GetOrdersResponse, string>({
      query: (userId) => ({
        url: `/order/get-all-orders/${userId}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.orders.map((o) => ({ type: "Order" as const, id: o._id })),
              { type: "Order" as const, id: "LIST" },
            ]
          : [{ type: "Order" as const, id: "LIST" }],
    }),

    getOrderById: builder.query<GetOrderResponse, string>({
      query: (id) => ({
        url: `/order/get-order/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
  }),
  overrideExisting: false,
});

export const { useCreateOrderMutation, useGetMyOrdersQuery, useGetOrderByIdQuery } = orderApiSlice;