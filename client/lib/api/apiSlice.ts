import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { env } from "@/config/env";

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

// Endpoints that establish a brand-new session on success — a successful
// call here means any previously-known "refresh is broken" state no
// longer applies.
const SESSION_ESTABLISHING_ENDPOINTS = ["/user/login-user", "/user/activation"];


function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

// Circuit breaker: once a refresh attempt has definitively failed, further
// 401s are known to be unrecoverable until the user logs in again. Without
// this flag, a 401 on getUserDetails triggers a refresh attempt, which
// fails, which invalidates the "User" tag, which refetches the still-
// subscribed getUserDetails query (AuthProvider never unmounts), which
// 401s again, triggering another refresh attempt — an infinite loop.
let sessionInvalid = false

function isRefreshExemptUrl(url: string): boolean {
  // Seller sessions run on a separate long-lived seller_token cookie with
  // no refresh-token flow of their own; the user access/refresh
  // interceptor below must never engage for shop endpoints, or a stale
  // seller session would spuriously invalidate a valid user session via
  // the shared `sessionInvalid` circuit breaker below.
  if (url.includes("/shop/")) return true;
  return REFRESH_EXEMPT_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = getRequestUrl(args);
  const isExempt = isRefreshExemptUrl(url);

  if (!result.error && SESSION_ESTABLISHING_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
    sessionInvalid = false;
  }

  if (result.error?.status === 401 && !isExempt) {
    if (sessionInvalid) {
      // Already confirmed refresh can't restore the session — surface
      // this request's own failure instead of retrying refresh or
      // re-invalidating the cache on every subsequent 401.
      return result;
    }

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
      // This now happens at most once per invalid session, guarded by
      // `sessionInvalid` above.
      sessionInvalid = true;
      api.dispatch(apiSlice.util.invalidateTags(["User"]))
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