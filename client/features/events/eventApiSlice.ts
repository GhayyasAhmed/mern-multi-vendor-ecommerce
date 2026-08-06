import { apiSlice } from "@/lib/api/apiSlice";

export interface IEventImage {
  public_id?: string;
  url: string;
}

export interface IEvent {
  _id: string;
  name: string;
  description: string;
  category: string;
  start_Date: string;
  Finish_Date: string;
  status: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: IEventImage[];
  shopId: string;
  shop: { _id?: string; name?: string; avatar?: { url?: string } };
  sold_out: number;
  createdAt: string;
  isActive?: boolean;
  isUpcoming?: boolean;
  isExpired?: boolean;
}

export interface GetAllEventsParams {
  status?: "active" | "upcoming" | "expired";
  limit?: number;
}

export interface GetAllEventsResponse {
  success: boolean;
  events: IEvent[];
}

export interface GetEventResponse {
  success: boolean;
  event: IEvent;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  category: string;
  start_Date: string;
  Finish_Date: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: string[];
  shopId: string;
}

export interface CreateEventResponse {
  success: boolean;
  event: IEvent;
}

export interface DeleteEventResponse {
  success: boolean;
  message: string;
}

function buildEventsQueryString(params: GetAllEventsParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const eventApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllEvents: builder.query<GetAllEventsResponse, GetAllEventsParams | void>({
      query: (params) => ({
        url: `/event/get-all-events${buildEventsQueryString(params ?? {})}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.events.map((e) => ({ type: "Event" as const, id: e._id })),
              { type: "Event" as const, id: "LIST" },
            ]
          : [{ type: "Event" as const, id: "LIST" }],
    }),

    getEventById: builder.query<GetEventResponse, string>({
      query: (id) => ({
        url: `/event/get-event/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),

    getShopEvents: builder.query<GetAllEventsResponse, string>({
      query: (shopId) => ({
        url: `/event/get-all-events/${shopId}`,
        method: "GET",
      }),
      providesTags: (result, _error, shopId) =>
        result
          ? [
              ...result.events.map((e) => ({ type: "Event" as const, id: e._id })),
              { type: "Event" as const, id: `SHOP-${shopId}` },
            ]
          : [{ type: "Event" as const, id: `SHOP-${shopId}` }],
    }),

    createEvent: builder.mutation<CreateEventResponse, CreateEventRequest>({
      query: (body) => ({
        url: "/event/create-event",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Event", id: "LIST" },
        { type: "Event", id: `SHOP-${body.shopId}` },
      ],
    }),

    deleteEvent: builder.mutation<DeleteEventResponse, { id: string; shopId: string }>({
      query: ({ id }) => ({
        url: `/event/delete-shop-event/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id, shopId }) => [
        { type: "Event", id },
        { type: "Event", id: "LIST" },
        { type: "Event", id: `SHOP-${shopId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllEventsQuery,
  useGetEventByIdQuery,
  useGetShopEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
} = eventApiSlice;