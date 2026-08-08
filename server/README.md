# Mercovia Server

> TypeScript/Express backend providing the authoritative business,
> security, persistence, payment and real-time layers for Mercovia.

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
-   Socket.IO communication
-   administrative operations

The client is never trusted for security-sensitive decisions.

## Structure

``` text
server/src/
├── config/         # environment and service configuration
├── controllers/    # request/domain orchestration
├── middlewares/    # auth, validation, errors, rate limiting
├── models/         # Mongoose models
├── routes/         # REST route definitions
├── socket/         # Socket.IO handlers
├── scripts/        # operational scripts
└── utils/          # validation, JWT, email, error utilities
```

This separation keeps HTTP concerns, domain logic, persistence and
infrastructure concerns from collapsing into one controller layer.

## Stack

Node.js, Express, TypeScript, MongoDB, Mongoose, Zod, JWT/HTTP-only
cookies, bcryptjs, Redis, Stripe, Cloudinary, Socket.IO, Nodemailer,
Helmet and CORS.

## Local Setup

``` bash
npm install
npm run dev
```

Create `server/.env` first.

### Environment categories

Use `src/config/env.ts` as the authoritative list of required names. The
application requires configuration for:

``` env
NODE_ENV=development
PORT=<server-port>
FRONTEND_URL=http://localhost:<frontend-port>
MONGO_URI=<mongodb-connection-string>
```

Also configure the names required by the current code for:

-   JWT/access/refresh authentication
-   Redis connection
-   Cloudinary credentials
-   Stripe secret/webhook credentials
-   SMTP/email delivery

Do not invent alternate variable names when editing the configuration;
follow `env.ts` and the service initialization modules.

## Admin Provisioning

For local development, configure:

``` env
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

Run:

``` bash
npm run seed:admin
```

The script creates an admin or promotes an existing account. It connects
directly to the configured MongoDB database. Never commit admin
credentials or production database credentials.

## Request Lifecycle

``` text
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
```

Validation protects the API contract; authorization protects the
resource; the database remains the source of truth for
integrity-sensitive state.

## Authentication and Authorization

Protected routes use authentication middleware and role authorization.
Seller-owned resources additionally require ownership checks where
applicable.

The backend must re-check every sensitive action even when the frontend
hides the corresponding UI.

## Validation and Errors

Zod schemas are applied through validation middleware. Controllers
should follow the project's asynchronous error-handling pattern and
allow centralized error middleware to preserve meaningful status codes.

Production responses must not expose stack traces, tokens, credentials
or internal secrets.

## Data Integrity

Marketplace operations are concurrency-sensitive. Stock, seller
balances, withdrawals and multi-shop order creation must use atomic
database operations or appropriate transaction boundaries.

Payment status is not accepted as proof merely because a client sends a
successful status. Stripe confirmation and verified webhook events
provide the authoritative payment boundary.

## Payments

Supported methods:

-   Cash on Delivery
-   Stripe PaymentIntents

Stripe webhooks require signature verification against the raw request
body. Do not place a JSON parser in front of the webhook route in a way
that changes the payload used for signature verification.

## Database

MongoDB is accessed through Mongoose. Core domains include users, shops,
products, events, orders, coupons, conversations, messages, withdrawals
and notifications.

List APIs should remain paginated and high-frequency ownership/look-up
fields should be indexed appropriately.

## Redis

Redis supports short-lived activation/session-related state and session
invalidation. A Redis-compatible service is required for complete
authentication testing.

## Cloudinary

Cloudinary stores user, seller, product and event media and supported
messaging attachments. The application server is not intended to become
permanent media storage.

## Socket.IO

Socket.IO handlers live under `src/socket/`. Messaging combines REST
persistence with real-time delivery. Changes to messaging should be
tested across both layers.

## Operational Scripts

``` bash
npm run seed:admin
```

Operational scripts should remain deliberate and environment-driven. Do
not expose administrative provisioning through an unauthenticated public
endpoint for convenience.

## Production Checklist

-   [ ] production `NODE_ENV`
-   [ ] production MongoDB URI
-   [ ] production Redis
-   [ ] exact deployed frontend `FRONTEND_URL`
-   [ ] strong unique JWT secrets
-   [ ] Cloudinary configured
-   [ ] Stripe secret and webhook signing secret configured
-   [ ] SMTP configured
-   [ ] CORS/origin policy verified
-   [ ] secure HTTPS cookie behavior verified
-   [ ] admin provisioned securely
-   [ ] no secrets committed
-   [ ] webhook raw-body handling verified
-   [ ] database indexes verified
-   [ ] logs contain no credentials/tokens/payment secrets

## Troubleshooting

**403 Request origin not allowed:** verify `FRONTEND_URL` exactly
matches the browser origin.

**MongoDB errors:** verify `MONGO_URI`, credentials, Atlas network
access and URL encoding for special characters.

**Cookie/auth errors:** verify origins, HTTPS, cookie flags and frontend
`credentials: include`.

**Redis errors:** verify connection URL/host/port, credentials and TLS
requirements.

**Stripe webhook errors:** verify webhook signing secret, endpoint
configuration and raw-body handling.

**Email errors:** verify SMTP host, port, credentials and sender
configuration.

## Related Documentation

See [`../README.md`](../README.md) for system-level documentation and
[`../client/README.md`](../client/README.md) for frontend setup.
