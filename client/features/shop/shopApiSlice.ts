import { apiSlice } from "@/lib/api/apiSlice";
import type { IShop } from "@/types";

export interface ApiSuccessMessage {
  success: boolean;
  message: string;
}

export interface CreateShopRequest {
  name: string;
  email: string;
  password: string;
  address: string;
  phoneNumber: number;
  zipCode: number;
  avatar: string;
}

export interface ActivateShopRequest {
  activation_token: string;
}

export interface LoginShopRequest {
  email: string;
  password: string;
}

export interface ShopAuthResponse {
  success: boolean;
  message: string;
  seller: IShop;
}

export interface GetSellerResponse {
  success: boolean;
  seller: IShop;
}

export interface GetShopInfoResponse {
  success: boolean;
  shop: Pick<IShop, "_id" | "name" | "description" | "avatar" | "address"> & {
    createdAt?: string;
  };
}

export interface UpdateSellerInfoRequest {
  name?: string;
  description?: string;
  address?: string;
  phoneNumber?: number;
  zipCode?: number;
}

export interface UpdateShopAvatarRequest {
  avatar: string;
}

export interface UpdateShopResponse {
  success: boolean;
  shop: IShop;
}

export const shopApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createShop: builder.mutation<ApiSuccessMessage, CreateShopRequest>({
      query: (body) => ({ url: "/shop/create-shop", method: "POST", body }),
    }),

    activateShop: builder.mutation<ShopAuthResponse, ActivateShopRequest>({
      query: (body) => ({ url: "/shop/activation", method: "POST", body }),
      invalidatesTags: ["Shop"],
    }),

    loginShop: builder.mutation<ShopAuthResponse, LoginShopRequest>({
      query: (body) => ({ url: "/shop/login-shop", method: "POST", body }),
      invalidatesTags: ["Shop"],
    }),

    getSellerDetails: builder.query<GetSellerResponse, void>({
      query: () => ({ url: "/shop/getSeller", method: "GET" }),
      providesTags: ["Shop"],
    }),

    logoutShop: builder.mutation<ApiSuccessMessage, void>({
      query: () => ({ url: "/shop/logout", method: "GET" }),
      invalidatesTags: ["Shop"],
    }),

    getShopInfo: builder.query<GetShopInfoResponse, string>({
      query: (id) => ({ url: `/shop/get-shop-info/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Shop", id }],
    }),

    updateSellerInfo: builder.mutation<UpdateShopResponse, UpdateSellerInfoRequest>({
      query: (body) => ({ url: "/shop/update-seller-info", method: "PUT", body }),
      invalidatesTags: ["Shop"],
    }),

    updateShopAvatar: builder.mutation<UpdateShopResponse, UpdateShopAvatarRequest>({
      query: (body) => ({ url: "/shop/update-shop-avatar", method: "PUT", body }),
      invalidatesTags: ["Shop"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateShopMutation,
  useActivateShopMutation,
  useLoginShopMutation,
  useGetSellerDetailsQuery,
  useLazyGetSellerDetailsQuery,
  useLogoutShopMutation,
  useGetShopInfoQuery,
  useUpdateSellerInfoMutation,
  useUpdateShopAvatarMutation,
} = shopApiSlice;