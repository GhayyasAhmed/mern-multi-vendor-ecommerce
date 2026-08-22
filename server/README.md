# Mercovia Server

> TypeScript/Express backend providing the authoritative business,
> security, persistence, and payment layers for Mercovia. Real-time
> delivery is handled by the separate
> [`socket-relay`](../socket-relay/README.md) service, bridged through
> Redis pub/sub.

For system-wide architecture, deployment topology, and the AWS/Docker
production setup, see the [root README](../README.md).

## Responsibilities

-   authentication and session management
-   role and ownership authorization
-   request validation
-   marketplace business rules
-   MongoDB persistence
-   inventory and financial integrity
-   payment processing and webhook verification
-   Cloudinary orchestration
-   transactional email
-   publishing real-time domain events to Redis (consumed by
    `socket-relay` — this process never holds a WebSocket connection
    itself)
-   issuing short-lived, single-use tickets that authorize a client to
    open a socket connection
-   administrative operations
-   liveness/readiness reporting for orchestration and CI/CD

The client is never trusted for security-sensitive decisions.

## Structure

```text
server/src/
├── config/         # environment and service configuration (env, db, redis, cloudinary, stripe)
├── controllers/    # request/domain orchestration
├── middlewares/    # auth, validation, errors, rate limiting
├── models/         # Mongoose models
├── routes/         # REST route definitions
├── socket/         # Redis publish helpers (index.ts, emitter.ts) — NOT a Socket.IO server
├── scripts/        # operational scripts (seedAdmin, cleanupOrphanedUploads)
└── utils/          # validation, JWT, socket ticket, email, crypto, error utilities
```

This separation keeps HTTP concerns, domain logic, persistence, and
infrastructure concerns from collapsing into one controller layer. Note
that `src/socket/` here contains only the Redis-publishing side of
real-time — the actual Socket.IO server lives in the sibling
[`socket-relay`](../socket-relay/README.md) service.

## Stack

Node.js, Express, TypeScript, MongoDB, Mongoose, Zod, JWT/HTTP-only
cookies, bcryptjs, Redis (ioredis), Stripe, Cloudinary, Nodemailer,
Helmet, and CORS.

## Local Setup

```bash
npm install
npm run dev
```

Create `server/.env` first (see below). `npm run dev` runs `tsx watch
src/server.ts`.

### Environment variables

`src/config/env.ts` is the authoritative list of variables the app
resolves at startup — treat it as the source of truth over any other
documentation, including this one.

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/mercovia
```

| Variable | Required in production | Notes |
|---|---|---|
| `NODE_ENV` | — | `development` \| `production`. Gates dev-only fallback secrets and `trust proxy`. |
| `PORT` | — | Defaults to `3001`. |
| `FRONTEND_URL` | — | Comma-separated list of allowed CORS origins; also the Origin-check allowlist for the CSRF mitigation middleware. Defaults to `http://localhost:5173` if unset (adjust for a Next.js dev server on `:3000`). |
| `MONGO_URI` | **yes** | Falls back to `mongodb://127.0.0.1:27017/multi-vendor-ecommerce` in development only; throws on boot in production if unset. Production uses database name `mercovia` — see `docker-compose.yml`. |
| `REDIS_URL` | **yes** | Consumed by `ioredis`. Required even outside chat — sessions, activation tokens, socket tickets, rate-limit-adjacent state, and the `socket_events` pub/sub channel all depend on it. Server throws on boot if unset. |
| `ACCESS_TOKEN` | **yes** | Access token signing secret. Falls back to a dev-only default outside production. |
| `REFRESH_TOKEN` | **yes** | Refresh token signing secret. Same fallback behavior. |
| `JWT_SECRET_KEY` | **yes** | Seller/shop token signing secret. Same fallback behavior. |
| `JWT_EXPIRES` | — | Minutes; used for short-lived activation-adjacent tokens. Default `5`. |
| `ACCESS_TOKEN_EXPIRE` | — | Hours. Default `2`. |
| `REFRESH_TOKEN_EXPIRE` | — | Hours. Default `24`. |
| `ENCRYPTION_KEY` | **yes** | AES-256-GCM key used to encrypt seller bank account numbers at rest. Dev-only fallback outside production. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for media features | |
| `STRIPE_SECRET_KEY` | for payments | Server throws on boot if unset (`config/stripe.ts`). |
| `STRIPE_PUBLISHABLE_KEY` | for payments | Returned to the client via `/api/v1/payment/stripeapikey`. |
| `STRIPE_WEBHOOK_SECRET` | for payments | Required for `/api/v1/payment/webhook` signature verification. |
| `STRIPE_CURRENCY` | — | Default `usd`. |
| `SMPT_HOST` / `SMPT_PORT` / `SMTP_SERVICE` / `SMTP_MAIL` / `SMTP_PASSWORD` | for email | Activation, password reset, and operational emails. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for `seedAdmin` script only | Not read by the running server process. |

Do not invent alternate variable names when editing configuration;
follow `env.ts` and the service initialization modules under
`config/`.

## Admin Provisioning

Configure in `server/.env`:

```env
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

`ADMIN_PASSWORD` must be at least 8 characters — the script exits
non-zero otherwise.

**Local (non-Docker):**

```bash
cd server
npx tsx src/scripts/seedAdmin.ts
```

**Docker / production:** the running container ships only compiled
output and production dependencies — `tsx` is not installed and
`src/` is not present. Run the compiled script instead:

```bash
docker compose exec server node dist/scripts/seedAdmin.js
```

> There is currently no `npm run seed:admin` script in
> `package.json`. If you want that convenience alias, add
> `"seed:admin": "tsx src/scripts/seedAdmin.ts"` — the script itself
> (`src/scripts/seedAdmin.ts`) already exists and works with either
> invocation shown above.

The script connects directly to the configured `MONGO_URI`, creates the
admin if the email doesn't exist, or promotes an existing user to
`role: "admin"`. Never commit admin credentials or run this against
production without deliberate intent.

## Request Lifecycle

```text
HTTP Request
    ↓
Route
    ↓
Authentication / Authorization / Rate Limit / Validation
    ↓
Controller
    ↓
Business Rules + Database + External Services
    ↓
Consistent Response
    (+ best-effort Redis publish of any resulting domain event)
```

Validation protects the API contract; authorization protects the
resource; the database remains the source of truth for
integrity-sensitive state.

## Authentication and Authorization

Protected routes use authentication middleware (`isAuthenticated`,
`isSeller`, `attachIdentity`) and role authorization (`authorizeRoles`).
Seller-owned resources additionally require ownership checks in the
controller (e.g. `String(product.shopId) === String(req.seller?._id)`).

The backend must re-check every sensitive action even when the frontend
hides the corresponding UI.

## Validation and Errors

Zod schemas (`utils/validators.ts`) are applied through the `validate`
middleware. Controllers follow the project's `catchAsyncErrors` wrapper
and allow the centralized `errorMiddleware` to translate Mongoose,
JWT, and validation errors into consistent, appropriately-classified
responses.

Production responses do not expose stack traces, tokens, credentials,
or internal secrets — `errorMiddleware` collapses unexpected
(non-operational, 5xx) errors to a generic message in production while
still logging the real error server-side.

## Data Integrity

Marketplace operations are concurrency-sensitive. Order creation
reserves stock atomically per item (`findOneAndUpdate` with a stock
guard) inside a MongoDB transaction, and seller balance
credit/debit/clawback flows (delivery, refund approval, withdrawal
approval/rejection) all use atomic, guarded updates
(`findOneAndUpdate` with a status precondition) rather than
read-modify-write, specifically to survive duplicate requests and
concurrent admin/seller actions without double-crediting or
double-debiting.

## Payments

Supported methods:

-   Cash on Delivery
-   Stripe PaymentIntents

Stripe webhooks require signature verification against the **raw**
request body (`app.use("/api/v1/payment/webhook", express.raw(...))` is
registered before the global JSON body parser specifically to preserve
this). Payment status is never accepted as authoritative merely because
a client reports success — order creation independently retrieves and
validates the PaymentIntent from Stripe, and only the verified webhook
flips `paymentInfo.status` to `Succeeded`/`Failed`.

## Database

MongoDB is accessed through Mongoose. Core domains include users, shops,
products, events, orders, coupons, conversations, messages, withdrawals,
and notifications.

List APIs are paginated (`utils/pagination.ts`) and high-frequency
ownership/lookup fields are indexed (see each model's `schema.index(...)`
calls — e.g. `shopId`, `category`, `conversationId`, `recipientId`).

Production database name is `mercovia` (see `docker-compose.yml`'s
`MONGO_URI`), running with authentication enabled
(`MONGO_INITDB_ROOT_USERNAME`/`PASSWORD`, `?authSource=admin`).
Development defaults to an unauthenticated local instance.

## Redis

Redis is a required dependency, not an optional cache. It backs:

-   session storage for access/refresh token validation
    (`utils/jwt.ts`, `middlewares/auth.ts`)
-   seller session storage (`utils/shopToken.ts`)
-   short-lived activation tokens and pending-signup state
-   single-use, 30-second socket authentication tickets
    (`utils/socketTicket.ts`)
-   the pending-avatar-upload cleanup queue
    (`utils/pendingUploads.ts`)
-   the `socket_events` pub/sub channel that bridges this stateless API
    process to the long-lived `socket-relay` process (see
    `src/socket/index.ts` and `src/socket/emitter.ts` — this server
    **publishes only**; it never runs a Socket.IO server itself)

A Redis-compatible service is required for the app to boot at all in
production (`config/redis.ts` throws if `REDIS_URL` is unset).

## Real-Time Event Publishing

This process never accepts WebSocket connections. Instead, controllers
call `publishSocketEvent(identityId, event, payload)`
(`src/socket/index.ts`) after a state change, which serializes
`{ identityId, event, payload }` onto the Redis channel
`socket_events`. The separate `socket-relay` service subscribes to that
channel and emits the event only to sockets belonging to `identityId`.

Domain events currently published this way: new order (to the seller
and to an `"admin"` room), order status updates, refund
requests/completions, seller balance changes, new conversations, chat
messages and last-message previews, message-seen receipts, stock
updates (broadcast to a `"public"` room), withdrawal request/status
changes, and generic user/seller/admin notifications
(`utils/notifications.ts` also persists a `Notification` document
alongside every emit).

See [`socket-relay/README.md`](../socket-relay/README.md) for the
consuming side of this bridge and the ticket-based connection
authentication flow.

## Cloudinary

Cloudinary stores user, seller, product, event, and messaging media.
The application server is not intended to become permanent media
storage. Failed uploads and failed DB writes after a successful upload
are compensated for with best-effort Cloudinary cleanup
(`Promise.allSettled` + rollback) in the relevant controllers.

## Operational Scripts

```bash
# Admin provisioning — see "Admin Provisioning" above
npx tsx src/scripts/seedAdmin.ts                    # local
docker compose exec server node dist/scripts/seedAdmin.js   # Docker/production

# Orphaned Cloudinary avatar cleanup — intended to run periodically
npm run cleanup:orphaned-uploads                    # local (tsx-based, defined in package.json)
docker compose exec server node dist/scripts/cleanupOrphanedUploads.js   # Docker/production
```

`cleanupOrphanedUploads.ts` removes avatar uploads that were attached
to an abandoned signup (never activated within
`PENDING_SIGNUP_TTL_SECONDS`, 24 hours) so Cloudinary storage doesn't
accumulate orphaned files. It is not scheduled anywhere in this
repository — run it via host `cron` calling the `docker compose exec`
form above, or an equivalent scheduler, on whatever cadence fits your
Cloudinary usage.

Operational scripts should remain deliberate and environment-driven. Do
not expose administrative provisioning through an unauthenticated
public endpoint for convenience.

## Health Check

```text
GET /api/v1/health-check
```

Returns `200` only when both MongoDB (`mongoose.connection.readyState
=== 1`) and Redis (`redis.status === "ready"`) are connected; `503`
otherwise. Used by the `server` container's Docker `HEALTHCHECK` and by
the CI/CD pipeline's post-deploy verification step. See the
[root README](../README.md#health-checks) for how this fits into the
broader deployment.

## Production Checklist

-   [ ] production `NODE_ENV`
-   [ ] production MongoDB URI (`mercovia` database, authenticated)
-   [ ] production Redis reachable
-   [ ] exact deployed frontend `FRONTEND_URL`
-   [ ] strong unique `ACCESS_TOKEN` / `REFRESH_TOKEN` / `JWT_SECRET_KEY` / `ENCRYPTION_KEY`
-   [ ] Cloudinary configured
-   [ ] Stripe secret and webhook signing secret configured
-   [ ] SMTP configured
-   [ ] CORS/origin policy verified against the real frontend origin
-   [ ] secure HTTPS cookie behavior verified (`SameSite=None; Secure`)
-   [ ] admin provisioned securely via `dist/scripts/seedAdmin.js`
-   [ ] no secrets committed
-   [ ] webhook raw-body handling verified (middleware ordering intact)
-   [ ] database indexes verified
-   [ ] `socket-relay` reachable and sharing the same `REDIS_URL`
-   [ ] `/api/v1/health-check` returns `200`
-   [ ] logs contain no credentials/tokens/payment secrets

## Troubleshooting

See the [root README's troubleshooting section](../README.md#troubleshooting)
for cross-service issues. Backend-specific:

**403 Request origin not allowed:** verify `FRONTEND_URL` exactly
matches the browser origin.

**MongoDB errors:** verify `MONGO_URI`, credentials, Atlas/host network
access, and URL encoding for special characters.

**Redis errors:** verify connection URL/host/port, credentials, and TLS
requirements. Remember this also breaks login/session validation and
real-time delivery, not just chat.

**Stripe webhook errors:** verify webhook signing secret, endpoint
configuration, and raw-body handling.

**Email errors:** verify SMTP host, port, credentials, and sender
configuration.

**Real-time events aren't reaching clients:** confirm `server` and
`socket-relay` point at the same `REDIS_URL` — they communicate only
through the `socket_events` channel, with no direct network link
between the two processes.

## Related Documentation

-   [`../README.md`](../README.md) — full system architecture,
    Docker/AWS deployment, CI/CD
-   [`../client/README.md`](../client/README.md) — frontend setup and
    API/socket integration
-   [`../socket-relay/README.md`](../socket-relay/README.md) — the
    Socket.IO service this backend publishes events to
