Mercovia Server

TypeScript/Express backend providing the authoritative business,security, persistence, payment and real-time layers for Mercovia.

Responsibilities

authentication and session management

role and ownership authorization

request validation

marketplace business rules

MongoDB persistence

inventory and financial integrity

payment processing and webhook verification

Cloudinary orchestration

transactional email

Socket.IO communication

administrative operations

The client is never trusted for security-sensitive decisions.

Structure

server/src/
├── config/         # environment and service configuration
├── controllers/    # request/domain orchestration
├── middlewares/    # auth, validation, errors, rate limiting
├── models/         # Mongoose models
├── routes/         # REST route definitions
├── socket/         # Socket.IO handlers
├── scripts/        # operational scripts
└── utils/          # validation, JWT, email, error utilities

This separation keeps HTTP concerns, domain logic, persistence andinfrastructure concerns from collapsing into one controller layer.

Stack

Node.js, Express, TypeScript, MongoDB, Mongoose, Zod, JWT/HTTP-onlycookies, bcryptjs, Redis, Stripe, Cloudinary, Socket.IO, Nodemailer,Helmet and CORS.

Local Setup

npm install
npm run dev

Create server/.env first.

Environment categories

Use src/config/env.ts as the authoritative list of required names. Theapplication requires configuration for:

NODE_ENV=development
PORT=<server-port>
FRONTEND_URL=http://localhost:<frontend-port>
MONGO_URI=<mongodb-connection-string>

Also configure the names required by the current code for:

JWT/access/refresh authentication

Redis connection

Cloudinary credentials

Stripe secret/webhook credentials

SMTP/email delivery

Do not invent alternate variable names when editing the configuration;follow env.ts and the service initialization modules.

Admin Provisioning

For local development, configure:

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>

Run:

npm run seed:admin

The script creates an admin or promotes an existing account. It connectsdirectly to the configured MongoDB database. Never commit admincredentials or production database credentials.

Request Lifecycle

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

Validation protects the API contract; authorization protects theresource; the database remains the source of truth forintegrity-sensitive state.

Authentication and Authorization

Protected routes use authentication middleware and role authorization.Seller-owned resources additionally require ownership checks whereapplicable.

The backend must re-check every sensitive action even when the frontendhides the corresponding UI.

Validation and Errors

Zod schemas are applied through validation middleware. Controllersshould follow the project's asynchronous error-handling pattern andallow centralized error middleware to preserve meaningful status codes.

Production responses must not expose stack traces, tokens, credentialsor internal secrets.

Data Integrity

Marketplace operations are concurrency-sensitive. Stock, sellerbalances, withdrawals and multi-shop order creation must use atomicdatabase operations or appropriate transaction boundaries.

Payment status is not accepted as proof merely because a client sends asuccessful status. Stripe confirmation and verified webhook eventsprovide the authoritative payment boundary.

Payments

Supported methods:

Cash on Delivery

Stripe PaymentIntents

Stripe webhooks require signature verification against the raw requestbody. Do not place a JSON parser in front of the webhook route in a waythat changes the payload used for signature verification.

Database

MongoDB is accessed through Mongoose. Core domains include users, shops,products, events, orders, coupons, conversations, messages, withdrawalsand notifications.

List APIs should remain paginated and high-frequency ownership/look-upfields should be indexed appropriately.

Redis

Redis supports short-lived activation/session-related state and sessioninvalidation. A Redis-compatible service is required for completeauthentication testing.

Cloudinary

Cloudinary stores user, seller, product and event media and supportedmessaging attachments. The application server is not intended to becomepermanent media storage.

Socket.IO

Socket.IO handlers live under src/socket/. Messaging combines RESTpersistence with real-time delivery. Changes to messaging should betested across both layers.

Operational Scripts

npm run seed:admin

Operational scripts should remain deliberate and environment-driven. Donot expose administrative provisioning through an unauthenticated publicendpoint for convenience.

Production Checklist

production NODE_ENV

production MongoDB URI

production Redis

exact deployed frontend FRONTEND_URL

strong unique JWT secrets

Cloudinary configured

Stripe secret and webhook signing secret configured

SMTP configured

CORS/origin policy verified

secure HTTPS cookie behavior verified

admin provisioned securely

no secrets committed

webhook raw-body handling verified

database indexes verified

logs contain no credentials/tokens/payment secrets

Troubleshooting

403 Request origin not allowed: verify FRONTEND_URL exactlymatches the browser origin.

MongoDB errors: verify MONGO_URI, credentials, Atlas networkaccess and URL encoding for special characters.

Cookie/auth errors: verify origins, HTTPS, cookie flags and frontendcredentials: include.

Redis errors: verify connection URL/host/port, credentials and TLSrequirements.

Stripe webhook errors: verify webhook signing secret, endpointconfiguration and raw-body handling.

Email errors: verify SMTP host, port, credentials and senderconfiguration.

Related Documentation

See ../README.md for system-level documentation and../client/README.md for frontend setup.