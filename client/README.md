# Mercovia Client

> Next.js frontend for Mercovia, responsible for the marketplace user
> experience, routing, client state, API integration, forms, protected
> navigation, and buyer/seller/admin workflows.

For system-wide architecture, deployment topology, and the AWS/Docker
production setup, see the [root README](../README.md).

## Responsibilities

The client is responsible for:

-   application routing and deep-linking
-   page composition
-   reusable UI components
-   buyer, seller, and admin workflows
-   Redux Toolkit state
-   RTK Query server-state management
-   form handling and client-side validation
-   authentication-state resolution
-   protected navigation
-   loading, error, and empty states
-   real-time messaging and notification UI

The browser is **not** the final authorization boundary. Sensitive
decisions remain enforced by the backend.

## Architecture

```text
React / Next.js UI (App Router)
       │
       ├── Route / Layout
       │
       ├── Feature components
       │
       ├── Redux Toolkit
       │      └── RTK Query
       │
       └── Socket.IO client
              │
              ▼
     same-origin /api/v1/* (Next.js rewrite proxy)
              │
              ▼
       Express REST API (server)
              │
              ▼
       MongoDB / Redis / services

Socket.IO client ──▶ socket-relay (separate service, separate origin)
```

RTK Query is the primary server-state layer. Domain API slices use the
shared API infrastructure (`lib/api/apiSlice.ts`) rather than creating
independent ad-hoc API clients.

## Structure

```text
client/
├── app/              # application routes and layouts
├── components/       # reusable/shared UI
├── features/         # domain-specific components and API slices
├── store/            # Redux store configuration
├── lib/              # api client, socket client, server-side fetch helper
├── config/           # runtime env accessor
├── public/           # static assets
└── styles/           # global/component styling
```

## Technology Stack

-   React / Next.js (App Router)
-   TypeScript
-   Redux Toolkit + RTK Query
-   React Hook Form + Zod
-   Tailwind CSS
-   Socket.IO client

## Environment Variables

Create `client/.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

| Variable | Read by | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `config/env.ts`, `lib/api/apiSlice.ts` | Browser-visible. Either an absolute backend URL (simple local dev) or a relative path like `/api/v1` (production pattern — see below). |
| `NEXT_PUBLIC_SOCKET_URL` | `config/env.ts`, `lib/socket.ts` | Browser-visible. Falls back to `NEXT_PUBLIC_API_URL` if unset. Must be a real origin — Socket.IO cannot be reached through the `/api/v1` rewrite. |
| `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` | Browser-visible. Used to build absolute canonical/OG URLs and the sitemap. Defaults to `http://localhost:3000`. |
| `BACKEND_API_URL` | `next.config.ts` (rewrites), `lib/server-api.ts` | **Server-only, never bundled to the browser.** The real backend origin the Next.js server proxies to and fetches from during SSR/build. |

`NEXT_PUBLIC_SERVER_URI` is **not** used anywhere in this codebase —
if you've seen it in older notes, ignore it.

### Two supported local patterns

**A. Direct (simplest for local-only work):**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

The browser calls the backend directly. Requires the backend's CORS
(`FRONTEND_URL`) and cookie `SameSite`/`Secure` settings to permit a
cross-origin, credentialed request from `http://localhost:3000` — the
existing `development` cookie/CORS defaults in `server/src/config/env.ts`
and `server/src/app.ts` support this out of the box.

**B. Same-origin proxy (matches production):**

```env
NEXT_PUBLIC_API_URL=/api/v1
BACKEND_API_URL=http://localhost:3001/api/v1
```

`next.config.ts`'s `rewrites()` proxies every `/api/v1/*` request from
the Next.js server to `BACKEND_API_URL`, so the browser only ever talks
to `localhost:3000`. This is the pattern used in production (see the
root README's request-flow diagram) and is worth using locally if
you're debugging cookie/CORS behavior specifically.

`BACKEND_API_URL` is also required (or an absolute `NEXT_PUBLIC_API_URL`)
for server-side data fetching — `lib/server-api.ts` throws if neither is
set, since it powers `generateMetadata`, `app/sitemap.ts`, and the
server-rendered product/event detail pages.

### Never put these in the client environment

-   MongoDB credentials
-   Redis credentials
-   JWT secrets
-   Cloudinary API secret
-   Stripe secret key
-   Stripe webhook secret
-   SMTP password
-   admin password
-   any other server-only credential

If a value is secret, it belongs in `server/.env`, not here. Only
variables prefixed `NEXT_PUBLIC_` are ever exposed to browser code —
`BACKEND_API_URL` is deliberately unprefixed so it can never leak into
the client bundle.

## Local Setup

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`. The backend (and, for real-time features,
`socket-relay`) must be running separately — see the
[root README](../README.md#local-development-without-docker).

## Authentication

Authentication is cookie-based and resolved from the backend — the
client never reads or interprets the HTTP-only token itself.

```text
Login / registration
      ↓
Server sets HTTP-only cookies (accessToken, refreshToken)
      ↓
Client resolves the current user via GET /api/v1/user/getuser
      ↓
Role-aware UI and navigation
      ↓
Backend re-validates every protected operation
```

`lib/api/apiSlice.ts` implements a circuit breaker around token
refresh: a 401 triggers one refresh attempt; if that also fails, the
session is marked invalid in Redux (`features/auth/sessionSlice.ts`) so
further requests don't retry a refresh that's already known to be
broken, and `useCurrentUser()` immediately reflects the logged-out
state without waiting on a stale cache entry.

Protected navigation should provide a good user experience, but it must
never be treated as the security mechanism — the backend re-checks
every sensitive action.

## Real-Time Client

`lib/socket.ts` connects to `NEXT_PUBLIC_SOCKET_URL` (the standalone
`socket-relay` service, **not** the REST API). Authentication is
ticket-based rather than cookie-based, since `socket-relay` runs on a
separate origin:

```text
useSocket() → connectSocket()
  1. Socket.IO's `auth` callback POSTs /api/v1/socket/ticket
     (cookie-authenticated, via the same-origin proxy)
  2. Server mints a single-use, 30-second Redis-backed ticket
  3. Socket.IO connects to socket-relay with { auth: { ticket } }
  4. socket-relay validates + deletes the ticket, joins the
     socket to a room keyed by the user/seller/admin identity
```

`hooks/use-socket.ts` lazily connects on first use per component;
`disconnectSocket()` is called on logout so a stale identity's socket
never lingers. See
[`socket-relay/README.md`](../socket-relay/README.md) for the other
side of this flow.

## Buyer / Seller / Admin Experience

See the [root README](../README.md#key-features) for the full feature
list — routing, protected layouts, and API integration for each role
live under `app/(main)`, `app/(auth)`, `app/(dashboard)`, and
`app/admin` respectively, with shared domain logic in `features/`.

## API Integration

RTK Query is the source of truth for remote API state.

Good patterns:

-   query data stays in the RTK Query cache
-   mutations invalidate affected tags
-   duplicate requests are avoided
-   loading and error states are explicit
-   pagination state is represented in the query arguments
-   stale UI data is refreshed through targeted tag invalidation rather
    than broad unnecessary refetches
-   where a socket event describes exactly what changed, the client
    patches the RTK Query cache directly via `updateQueryData` instead
    of invalidating and refetching (see `features/auth/components/AuthProvider.tsx`)

Avoid copying API responses into separate Redux state unless there is a
concrete client-state requirement (the cart, which must persist
per-identity in `localStorage`, is the deliberate exception — see
`features/cart/cartSlice.ts`).

## UI State Standards

Every asynchronous screen should explicitly handle:

```text
Loading
   │
   ├── Success
   │      └── Empty
   │
   └── Error
```

Mutations should additionally handle disabled/submitting state, success
feedback, validation feedback, API error feedback, and cache
invalidation.

## Forms

Forms should validate input client-side before avoidable API requests,
show field-level errors, prevent duplicate submission, preserve entered
values after recoverable failures, surface server validation errors,
and give clear success/failure feedback.

## Routing and Deep Linking

Every implemented page supports direct URL navigation and browser
refresh where appropriate — do not rely on arriving through a specific
UI path.

```text
Unauthenticated request to a protected route
       ↓
proxy.ts redirects to /login?redirect=<original path>
       ↓
Authenticated session
       ↓
Original destination
```

Route protection (`proxy.ts` at the edge, plus
`features/*/components/*ProtectedRoute.tsx` client-side) should remain
consistent with backend authorization — it is a UX convenience, not the
security boundary.

## Media

Cloudinary-backed media is represented by URLs/references returned by
the backend. The frontend never holds Cloudinary API secrets — uploads
are base64-encoded client-side and sent to the backend, which performs
the actual Cloudinary upload.

## Security Rules

1.  Never trust frontend role checks for authorization.
2.  Never store server secrets in `NEXT_PUBLIC_*` variables.
3.  Never treat a client-side payment-success flag as proof of payment.
4.  Avoid logging authentication credentials or sensitive payment data.
5.  Preserve HTTP-only cookie behavior.
6.  Keep API URLs environment-specific.
7.  Do not expose internal server errors directly to users.

## Troubleshooting

See the [root README's troubleshooting section](../README.md#troubleshooting)
for cross-service issues (CORS, cookies through the proxy, Redis,
real-time). Client-specific checks:

### API requests fail

Confirm `NEXT_PUBLIC_API_URL` (and, if using the proxy pattern,
`BACKEND_API_URL`) and that the backend is reachable at that address.

### Product images do not load

Verify the Cloudinary URLs returned by the backend and the
`images.remotePatterns` configuration in `next.config.ts`.

### Messaging does not update

Check `NEXT_PUBLIC_SOCKET_URL`, that `socket-relay` is running, that
`POST /api/v1/socket/ticket` succeeds, and the browser's WebSocket
panel for a successful upgrade.

## Frontend Engineering Standards

-   Prefer domain-oriented components.
-   Keep shared components generic.
-   Keep business rules out of presentational components where
    practical.
-   Use RTK Query for remote state.
-   Keep transient UI state local.
-   Avoid duplicate requests.
-   Preserve deep-linking.
-   Make asynchronous states explicit.
-   Keep accessibility semantics meaningful.
-   Avoid fake/hardcoded data in production flows.
-   Do not use the UI as an authorization mechanism.

## Related Documentation

-   [`../README.md`](../README.md) — full system architecture,
    Docker/AWS deployment, CI/CD
-   [`../server/README.md`](../server/README.md) — backend API,
    environment variables, operational scripts
-   [`../socket-relay/README.md`](../socket-relay/README.md) — real-time
    service, ticket auth, Redis adapter
