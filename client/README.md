Mercovia Client

Next.js frontend for Mercovia. The client is responsible forpresentation, routing, client state and complete buyer/seller/adminexperiences while the backend remains the security and business-ruleauthority.

Responsibilities

Next.js App Router pages and layouts

reusable UI components

buyer, seller and admin workflows

Redux Toolkit state

RTK Query server-state management

form validation

authentication-state resolution

protected navigation

real-time messaging UI

loading, error and empty states

The browser is never treated as the final authorization boundary andnever owns payment truth.

Structure

client/
├── app/           # Next.js routes/layouts
├── components/    # shared UI
├── features/      # domain-specific UI and API integration
├── lib/           # shared infrastructure / API layer
├── store/         # Redux store
├── types/         # frontend types
├── styles/        # styling
└── public/        # static assets

The feature structure is intentionally domain-oriented so newmarketplace capabilities can be added without turning shared componentsinto a monolith.

API Architecture

RTK Query is the primary server-state layer. A shared API slice handlesthe API base URL, cookies, refresh behavior, tags and cacheinvalidation; domain slices inject their endpoints into it.

This avoids separate ad-hoc API clients and keeps cache behaviorpredictable.

Environment

Create client/.env.local:

NEXT_PUBLIC_SERVER_URI=http://localhost:<server-port>/api/v1

NEXT_PUBLIC_* values are browser-visible. Never put secrets in them.

The backend API prefix should match the route prefix exposed by theserver.

Local Setup

npm install
npm run dev

The backend must be running separately. Typical local topology:

Browser → Next.js → Express API → MongoDB / Redis / external services

Production Build

npm run build
npm run start

Before shipping a change, verify that direct navigation, browserrefresh, protected routes, API failures, empty collections, mutationinvalidation and reconnect behavior all work as expected.

Authentication

Authentication is cookie-based. The browser sends credentials with APIrequests and the client resolves the current user from the backendbecause HTTP-only tokens are intentionally unavailable to JavaScript.

Auth flows include:

login

registration

activation

forgot password

reset password

session refresh

account management

Protected navigation uses middleware plus client-side session checkswhere required.

Domain Coverage

Products

Listing, search/filtering, details, seller management, media andreviews.

Cart

User-scoped cart state, quantity management, stock revalidation andcheckout preparation.

Orders

Buyer order history/details, fulfillment state, refunds and multi-shopcheckout results.

Shops and Events

Seller storefronts, seller profile information and eventlisting/detail/management flows.

Coupons

Checkout coupon validation and seller coupon management.

Conversations and Messaging

Conversation lists, message history, message sending and real-timeupdates.

Seller Dashboard

Profile, products, events, orders, coupons, payouts and messaging.

Administration

Protected platform-level operational screens and API consumers.

UI State Standards

Every asynchronous domain flow should explicitly account for:

Loading → Success / Empty
       ↘ Error

Mutations should also prevent duplicate submission and providesuccess/error feedback while invalidating affected cached data.

Frontend Engineering Rules

Use the shared RTK Query infrastructure.

Keep server state in RTK Query rather than duplicating it in localRedux state.

Keep transient UI state local where possible.

Validate before avoidable requests.

Never use frontend visibility as an authorization mechanism.

Preserve direct URL navigation and deep-linking.

Make loading/error/empty states explicit.

Avoid duplicate requests and unnecessary refetches.

Never expose secrets through NEXT_PUBLIC_* variables.

Troubleshooting

403 from the API

Check that the backend is running, NEXT_PUBLIC_SERVER_URI is correct,and the backend FRONTEND_URL exactly matches the browser origin.

Authentication fails

Inspect browser cookies and the current-user request. HTTP-only cookiescannot be inspected from JavaScript; diagnose them through browserdeveloper tools and the API response.

Images fail

Verify the returned Cloudinary URL and the trusted image-hostconfiguration in next.config.ts.

Messaging fails

Verify the backend Socket.IO server, configured backend origin,authenticated session and WebSocket connection.

Related Documentation

See ../README.md for the complete system and../server/README.md for backend setup.