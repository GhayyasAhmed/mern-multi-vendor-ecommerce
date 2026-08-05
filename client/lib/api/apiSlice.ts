import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import {env} from "@/config/env";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  credentials: "include",
});

// Endpoints where a 401 is expected/normal and should never trigger a
// token-refresh retry (anonymous users, the refresh call itself, and the
// public auth flows).
const REFRESH_EXEMPT_ENDPOINTS = [
  "/user/refresh-token",
  "/user/login-user",
  "/user/create-user",
  "/user/activation",
  "/user/forgot-password",
  "/user/reset-password",
];

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = getRequestUrl(args);
  const isExempt = REFRESH_EXEMPT_ENDPOINTS.some((endpoint) => url.includes(endpoint));

  if (result.error?.status === 401 && !isExempt) {
    // Access token cookie likely expired; use the refresh token (also a
    // cookie) to mint a new access token, then retry the original request.
    const refreshResult = await rawBaseQuery(
      { url: "/user/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed too: the session is really over. Invalidate the
      // cached user so dependent UI (e.g. getUserDetails) reflects logout.
      api.dispatch(apiSlice.util.invalidateTags(["User"]));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Shop",
    "Product",
    "Order",
    "Event",
    "Conversation",
  ],
  endpoints: () => ({}),
});