import { apiSlice } from "@/lib/api/apiSlice";
import type { IUser } from "@/types";

export interface ApiSuccessMessage {
    success: boolean;
    message: string;
}

export interface ResendActivationRequest {
    email: string;
}

export interface RegisterUserRequest {
    name: string;
    email: string;
    password: string;
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


// add interfaces
export interface UpdateUserProfileRequest {
    name?: string;
    phoneNumber?: number;
}

export interface UpdateUserEmailRequest {
    email: string;
    password: string;
}

export interface UpdateUserAvatarRequest {
    avatar: string;
}

export interface UpdateUserAddressRequest {
    _id?: string;
    country?: string;
    city?: string;
    address1?: string;
    address2?: string;
    zipCode?: number;
    addressType: string;
}

export interface UpdateUserPasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateUserResponse {
    success: boolean;
    user: IUser;
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

        resendActivation: builder.mutation<ApiSuccessMessage, ResendActivationRequest>({
            query: (body) => ({
                url: "/user/resend-activation",
                method: "POST",
                body,
            }),
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
                method: "POST",
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

        // add endpoints inside injectEndpoints
        updateUserProfile: builder.mutation<UpdateUserResponse, UpdateUserProfileRequest>({
            query: (body) => ({ url: "/user/update-user-profile", method: "PUT", body }),
            invalidatesTags: ["User"],
        }),

        updateUserEmail: builder.mutation<UpdateUserResponse, UpdateUserEmailRequest>({
            query: (body) => ({ url: "/user/update-user-email", method: "PUT", body }),
            invalidatesTags: ["User"],
        }),

        updateUserAvatar: builder.mutation<UpdateUserResponse, UpdateUserAvatarRequest>({
            query: (body) => ({ url: "/user/update-avatar", method: "PUT", body }),
            invalidatesTags: ["User"],
        }),

        updateUserAddress: builder.mutation<UpdateUserResponse, UpdateUserAddressRequest>({
            query: (body) => ({ url: "/user/update-user-addresses", method: "PUT", body }),
            invalidatesTags: ["User"],
        }),

        deleteUserAddress: builder.mutation<UpdateUserResponse, string>({
            query: (id) => ({ url: `/user/delete-user-address/${id}`, method: "DELETE" }),
            invalidatesTags: ["User"],
        }),

        updateUserPassword: builder.mutation<ApiSuccessMessage, UpdateUserPasswordRequest>({
            query: (body) => ({ url: "/user/update-user-password", method: "PUT", body }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useRegisterUserMutation,
    useActivateUserMutation,
    useResendActivationMutation,
    useLoginUserMutation,
    useGetUserDetailsQuery,
    useLazyGetUserDetailsQuery,
    useLogoutUserMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useUpdateUserProfileMutation,
    useUpdateUserEmailMutation,
    useUpdateUserAvatarMutation,
    useUpdateUserAddressMutation,
    useDeleteUserAddressMutation,
    useUpdateUserPasswordMutation,
} = authApiSlice;