import { apiSlice } from "@/lib/api/apiSlice";

export interface GetStripeApiKeyResponse {
  stripeApikey: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  client_secret: string;
  paymentIntentId: string;
}

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStripeApiKey: builder.query<GetStripeApiKeyResponse, void>({
      query: () => ({
        url: "/payment/stripeapikey",
        method: "GET",
      }),
    }),

    createPaymentIntent: builder.mutation<CreatePaymentIntentResponse, CreatePaymentIntentRequest>({
      query: (body) => ({
        url: "/payment/process",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStripeApiKeyQuery,
  useCreatePaymentIntentMutation,
} = paymentApiSlice;