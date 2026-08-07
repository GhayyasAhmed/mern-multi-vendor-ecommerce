import { apiSlice } from "@/lib/api/apiSlice";

export interface INotification {
  _id: string;
  recipientId: string;
  recipientRole: "user" | "seller" | "admin";
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  notifications: INotification[];
  unreadCount: number;
  pagination: { currentPage: number; totalPages: number; totalItems: number; limit: number };
}

export interface ApiSuccessMessage { success: boolean; message: string; }

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, { page?: number; limit?: number } | void>({
      query: (params) => {
        const p = new URLSearchParams();
        if (params?.page) p.set("page", String(params.page));
        if (params?.limit) p.set("limit", String(params.limit));
        const qs = p.toString();
        return { url: `/notification/list${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [...result.notifications.map((n) => ({ type: "Notification" as const, id: n._id })), { type: "Notification" as const, id: "LIST" }]
          : [{ type: "Notification" as const, id: "LIST" }],
    }),
    markNotificationRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notification/mark-read/${id}`, method: "PUT" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllNotificationsRead: builder.mutation<ApiSuccessMessage, void>({
      query: () => ({ url: "/notification/mark-all-read", method: "PUT" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } = notificationApiSlice;