import { apiSlice } from "@/lib/api/apiSlice";
import type { IUser } from "@/types";

export interface ApiSuccessMessage {
  success: boolean;
  message: string;
}

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  /** Base64 data URI. Required in practice: the backend uploads it to
   *  Cloudinary unconditionally on account creation. */
  avatar: string;
}

export interface ActivateUserRequest {
  activation_token: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  success: boolean;
  message: string;
  user: IUser;
}

export interface GetUserResponse {
  success: boolean;
  user: IUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation<ApiSuccessMessage, RegisterUserRequest>({
      query: (body) => ({
        url: "/user/create-user",
        method: "POST",
        body,
      }),
    }),

    activateUser: builder.mutation<AuthUserResponse, ActivateUserRequest>({
      query: (body) => ({
        url: "/user/activation",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    loginUser: builder.mutation<AuthUserResponse, LoginUserRequest>({
      query: (body) => ({
        url: "/user/login-user",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    getUserDetails: builder.query<GetUserResponse, void>({
      query: () => ({
        url: "/user/getuser",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    logoutUser: builder.mutation<ApiSuccessMessage, void>({
      query: () => ({
        url: "/user/logout",
        method: "GET",
      }),
      invalidatesTags: ["User"],
    }),

    forgotPassword: builder.mutation<ApiSuccessMessage, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/user/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<ApiSuccessMessage, ResetPasswordRequest>({
      query: ({ token, ...body }) => ({
        url: `/user/reset-password/${encodeURIComponent(token)}`,
        method: "PUT",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterUserMutation,
  useActivateUserMutation,
  useLoginUserMutation,
  useGetUserDetailsQuery,
  useLazyGetUserDetailsQuery,
  useLogoutUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApiSlice;