# Mercovia Client

> Frontend application for Mercovia, responsible for the marketplace
> user experience, routing, client state, API integration, forms,
> protected navigation, and buyer/seller/admin workflows.

## Responsibilities

The client is responsible for:

-   application routing and deep-linking
-   page composition
-   reusable UI components
-   buyer workflows
-   seller dashboard workflows
-   administrative UI
-   Redux Toolkit state
-   RTK Query server-state management
-   form handling and client-side validation
-   authentication-state resolution
-   protected navigation
-   loading, error, and empty states
-   real-time messaging UI

The browser is **not** the final authorization boundary. Sensitive
decisions remain enforced by the backend.

## Architecture

``` text
React / Next.js UI
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
       Express REST API
              │
              ▼
       MongoDB / Redis / services
```

RTK Query is the primary server-state layer. Domain API slices should
use the shared API infrastructure rather than creating independent
ad-hoc API clients.

## Structure

The exact tree may evolve, but the client is organized around
application routes, shared components, domain features, and state
infrastructure.

Typical responsibilities:

``` text
client/
├── app/              # application routes and layouts
├── components/       # reusable/shared UI
├── features/         # domain-specific components and API slices
├── store/            # Redux store configuration
├── public/            # static assets
├── styles/            # global/component styling
└── ...
```

## Technology Stack

-   React / Next.js
-   JavaScript / TypeScript where applicable
-   Redux Toolkit
-   RTK Query
-   React Hook Form
-   Zod where used
-   Tailwind CSS
-   Socket.IO client

## Environment Variables

Create:

``` text
client/.env.local
```

The frontend API configuration uses:

``` env
NEXT_PUBLIC_SERVER_URI=http://localhost:3001/api/v1
```

`NEXT_PUBLIC_*` variables are exposed to browser code.

### Never put these in the client environment

-   MongoDB credentials
-   Redis credentials
-   JWT secrets
-   Cloudinary API secret
-   Stripe secret key
-   Stripe webhook secret
-   SMTP password
-   admin password
-   any server-only credential

If a value is secret, it belongs in the backend environment.

## Local Setup

From the repository root:

``` bash
cd client
npm install
npm run dev
```

Open:

``` text
http://localhost:3000
```

The backend must be running separately.

Typical topology:

``` text
Browser
   │
   ├── HTTP + cookies ──────► Express API
   │
   └── Socket.IO ───────────► Socket.IO server
                                  │
                                  ▼
                              MongoDB / Redis
```

## Production Build

``` bash
npm run build
npm run start
```

Before deployment, verify:

-   direct route navigation
-   browser refresh
-   protected routes
-   authentication/session restoration
-   API failures
-   empty collections
-   mutation invalidation
-   pagination
-   Socket.IO reconnect behavior
-   production API URL
-   image loading

## Authentication

Authentication is cookie-based.

The client does not need to read the HTTP-only authentication token.
Instead, it resolves the current authenticated user from the backend.

Expected flow:

``` text
Login / registration
      ↓
Server sets HTTP-only cookies
      ↓
Client resolves current user
      ↓
Role-aware UI and navigation
      ↓
Backend re-validates every protected operation
```

Protected navigation should provide a good user experience, but it must
never be treated as the security mechanism.

## Buyer Experience

The buyer-facing client supports:

-   marketplace browsing
-   product search/filtering
-   product details
-   seller/shop discovery
-   cart management
-   stock revalidation
-   checkout
-   COD / Stripe payment flows
-   multi-shop order results
-   order history
-   order details
-   supported refunds
-   eligible product reviews
-   account management
-   saved address management
-   coupons
-   seller communication
-   notifications where enabled

## Seller Experience

Seller-facing UI includes:

-   seller dashboard
-   shop profile
-   payout configuration
-   product management
-   event management
-   inventory management
-   order management
-   coupon management
-   withdrawal requests
-   withdrawal history/status
-   buyer conversations
-   seller operational information

Seller actions should always use backend authorization and ownership
checks.

## Admin Experience

The admin client exposes protected platform operations where
implemented.

Typical administrative areas include:

-   users
-   sellers
-   products
-   events
-   orders
-   withdrawals
-   moderation/corrective operations

Admin UI visibility is only a convenience. Backend admin authorization
remains authoritative.

## Domain Coverage

### Products

-   listing
-   search
-   filtering
-   pagination
-   product details
-   seller management
-   media
-   reviews and ratings

### Cart

-   user-scoped persistence
-   quantity changes
-   stock validation
-   checkout preparation

### Orders

-   buyer order history
-   order details
-   multi-shop checkout results
-   fulfillment status
-   refunds

### Payments

-   COD
-   Stripe PaymentIntent integration
-   payment state feedback

### Shops and Events

-   seller storefronts
-   seller information
-   event listing/details
-   seller management

### Coupons

-   checkout coupon validation
-   seller coupon management

### Conversations and Messaging

-   conversation lists
-   message history
-   sending messages
-   real-time updates
-   presence/read state where enabled

### Seller Dashboard

-   profile
-   products
-   events
-   orders
-   coupons
-   payouts
-   messaging

### Administration

-   protected platform-level management

## API Integration

RTK Query should be treated as the source of truth for remote API state.

Good patterns:

-   query data stays in RTK Query cache
-   mutations invalidate affected tags
-   duplicate requests are avoided
-   loading and error states are explicit
-   pagination state is represented in the query arguments
-   stale UI data is refreshed through targeted invalidation rather than
    broad unnecessary refetches

Avoid copying API responses into separate Redux state unless there is a
concrete client-state requirement.

## UI State Standards

Every asynchronous screen should explicitly handle:

``` text
Loading
   │
   ├── Success
   │      └── Empty
   │
   └── Error
```

Mutations should additionally handle:

-   disabled/submitting state
-   success feedback
-   validation feedback
-   API error feedback
-   cache invalidation

## Forms

Forms should:

-   validate user input before avoidable API requests
-   show field-level errors where practical
-   prevent duplicate submission
-   preserve useful entered values after recoverable failures
-   handle server validation failures
-   provide clear success/failure feedback

## Routing and Deep Linking

Every implemented page should support direct URL navigation and browser
refresh where appropriate.

Do not rely on arriving through a specific UI path to make a page work.

For protected routes:

``` text
Unauthenticated request
       ↓
Login / redirect flow
       ↓
Authenticated session
       ↓
Original destination
```

Route protection should remain consistent with backend authorization.

## Real-Time Messaging

Messaging combines REST data with Socket.IO.

The client should account for:

-   connection state
-   reconnect behavior
-   message loading
-   message send failures
-   empty conversations
-   new incoming messages
-   presence where enabled
-   read/message-seen state where enabled

Real-time UI should not assume that a socket event is the only source of
truth; persisted messages come from the backend API.

## Media

Cloudinary-backed media is represented by URLs/references returned by
the backend.

The frontend should not contain Cloudinary API secrets.

Image handling should include meaningful alt text and sensible loading
behavior.

## Security Rules

1.  Never trust frontend role checks for authorization.
2.  Never store server secrets in `NEXT_PUBLIC_*` variables.
3.  Never treat a client-side payment-success flag as proof of payment.
4.  Avoid logging authentication credentials or sensitive payment data.
5.  Preserve HTTP-only cookie behavior.
6.  Keep API URLs environment-specific.
7.  Do not expose internal server errors directly to users.

## Troubleshooting

### API requests fail

Verify:

``` env
NEXT_PUBLIC_SERVER_URI=http://localhost:3001/api/v1
```

and confirm the backend is running.

### 403 / CORS errors

Verify the backend's allowed frontend origin exactly matches the browser
origin.

### Authentication does not persist

Check:

-   browser cookies
-   `credentials` handling
-   backend CORS credentials
-   frontend/backend origins
-   HTTPS/cookie settings in production

### Product images do not load

Verify the Cloudinary URLs returned by the backend and the framework's
image configuration if applicable.

### Messaging does not update

Check:

-   Socket.IO connection
-   backend URL
-   authenticated session
-   browser network/WebSocket panel
-   backend socket handlers

### Admin pages are inaccessible

Verify the current account has `role: "admin"` and re-authenticate after
changing the role.

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

-   [`../README.md`](../README.md) --- complete project overview and
    local setup
-   [`../server/README.md`](../server/README.md) --- backend
    architecture, configuration, API and operations
