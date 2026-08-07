import { apiSlice } from "@/lib/api/apiSlice";

export interface IConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
}

export interface IConversation {
  _id: string;
  groupTitle?: string;
  members: string[];
  userId: string;
  sellerId: string;
  user: IConversationParticipant;
  seller: IConversationParticipant;
  lastMessage?: string;
  lastMessageId?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessageImage {
  public_id?: string;
  url?: string;
}

export interface IMessage {
  _id: string;
  conversationId?: string;
  text?: string;
  sender?: string;
  images?: IMessageImage;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface GetConversationsParams {
  id: string;
  page?: number;
  limit?: number;
}

export interface GetConversationsResponse {
  success: boolean;
  conversations: IConversation[];
  pagination: ConversationsPagination;
}

export interface GetMessagesParams {
  conversationId: string;
  before?: string;
}

export interface CreateConversationRequest {
  sellerId: string;
}

export interface CreateConversationResponse {
  success: boolean;
  conversation: IConversation;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: IMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface SendMessageRequest {
  conversationId: string;
  text?: string;
  images?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: IMessage;
}

export const conversationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserConversations: builder.query<GetConversationsResponse, GetConversationsParams>({
      query: ({ id, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return {
          url: `/conversation/get-all-conversation-user/${id}${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.conversations.map((c) => ({ type: "Conversation" as const, id: c._id })),
            { type: "Conversation" as const, id: "USER-LIST" },
          ]
          : [{ type: "Conversation" as const, id: "USER-LIST" }],
    }),

    getSellerConversations: builder.query<GetConversationsResponse, GetConversationsParams>({
      query: ({ id, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return {
          url: `/conversation/get-all-conversation-seller/${id}${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.conversations.map((c) => ({ type: "Conversation" as const, id: c._id })),
            { type: "Conversation" as const, id: "SELLER-LIST" },
          ]
          : [{ type: "Conversation" as const, id: "SELLER-LIST" }],
    }),

    createConversation: builder.mutation<CreateConversationResponse, CreateConversationRequest>({
      query: (body) => ({
        url: "/conversation/create-new-conversation",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Conversation", id: "USER-LIST" },
        { type: "Conversation", id: "SELLER-LIST" },
      ],
    }),

    getMessages: builder.query<GetMessagesResponse, GetMessagesParams>({
      query: ({ conversationId, before }) => ({
        url: `/message/get-all-messages/${conversationId}${before ? `?before=${encodeURIComponent(before)}` : ""}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { conversationId }) => [{ type: "Message", id: conversationId }],
    }),

    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (body) => ({
        url: "/message/create-new-message",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Message", id: body.conversationId },
        { type: "Conversation", id: "USER-LIST" },
        { type: "Conversation", id: "SELLER-LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserConversationsQuery,
  useGetSellerConversationsQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
} = conversationApiSlice;