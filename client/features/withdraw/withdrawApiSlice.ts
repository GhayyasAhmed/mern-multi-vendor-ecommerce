import { apiSlice } from "@/lib/api/apiSlice";

export interface IWithdraw {
  _id: string;
  shopId: string;
  seller: { _id: string; name: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface GetMyWithdrawsParams {
  page?: number;
  limit?: number;
}

export interface GetMyWithdrawsResponse {
  success: boolean;
  withdraws: IWithdraw[];
  pagination: WithdrawPagination;
}

export interface CreateWithdrawRequest {
  amount: number;
}

export interface CreateWithdrawResponse {
  success: boolean;
  withdraw: IWithdraw;
}

function buildWithdrawQueryString(params: GetMyWithdrawsParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const withdrawApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyWithdrawRequests: builder.query<GetMyWithdrawsResponse, GetMyWithdrawsParams | void>({
      query: (params) => ({
        url: `/withdraw/get-my-withdraw-requests${buildWithdrawQueryString(params ?? {})}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.withdraws.map((w) => ({ type: "Withdraw" as const, id: w._id })),
            { type: "Withdraw" as const, id: "MY-LIST" },
          ]
          : [{ type: "Withdraw" as const, id: "MY-LIST" }],
    }),

    createWithdrawRequest: builder.mutation<CreateWithdrawResponse, CreateWithdrawRequest>({
      query: (body) => ({
        url: "/withdraw/create-withdraw-request",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: "Withdraw", id: "MY-LIST" }, "Shop"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyWithdrawRequestsQuery,
  useCreateWithdrawRequestMutation,
} = withdrawApiSlice;