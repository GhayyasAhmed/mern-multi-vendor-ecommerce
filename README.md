# Mercovia

> Production-oriented multi-vendor e-commerce marketplace demonstrating
> full-stack engineering, domain-oriented architecture, secure API
> design, data integrity, and real-world buyer, seller, and admin
> workflows.

**Live application:** https://mercovia.vercel.app

## Overview

Mercovia is a full-stack marketplace where multiple sellers can manage
products, events, orders, coupons, conversations, payouts, and shop
operations while buyers can discover products, maintain a user-scoped
cart, complete checkout, track orders, request supported refunds, submit
eligible reviews, manage their account, and communicate with sellers.

The project is intentionally designed beyond a basic CRUD
implementation. The architecture addresses the boundaries that matter in
a marketplace:

-   authentication and role-based authorization
-   frontend/backend contract alignment
-   server-side validation
-   protected routes and deep-linking
-   inventory and order integrity
-   payment verification
-   seller balance integrity
-   pagination for production-scale list endpoints
-   RTK Query caching and invalidation
-   real-time messaging
-   external media storage
-   explicit loading, error, and empty states
-   administrative operations and moderation

The implementation is organized so that buyer, seller, and administrator
responsibilities remain distinct while sharing the same backend domain
model and API contracts.

## Key Features

### Buyer

-   Register and activate an account
-   Log in and maintain an authenticated session
-   Browse and search marketplace products
-   Filter products by category, price, and rating
-   View product details and seller information
-   Add products to a user-scoped cart
-   Revalidate product availability before checkout
-   Complete multi-shop checkout
-   Pay using supported payment methods
-   View all resulting orders
-   Track order status
-   Request supported refunds
-   Submit eligible product reviews
-   Manage profile information and addresses
-   Apply seller coupons during checkout
-   Communicate with sellers

### Seller

-   Register and activate a seller account
-   Manage shop profile and shop media
-   Configure payout/withdrawal information
-   Create, update, and delete products
-   Create, update, and delete events
-   Upload product and event media
-   Manage incoming orders
-   Update fulfillment status
-   Manage seller coupons
-   View seller balance and withdrawal history
-   Request withdrawals
-   Communicate with buyers
-   Receive operational notifications

### Admin

-   Securely provision an administrator account
-   Access protected administrative routes
-   Review users and sellers
-   Review products, events, and orders
-   Manage withdrawals
-   Perform authorized platform-level corrective and moderation
    operations
-   Monitor marketplace data through protected admin APIs and UI

## Architecture

``` text
                         Browser
                            │
                ┌───────────┴───────────┐
                │                       │
           HTTP / Cookies          Socket.IO
                │                       │
                ▼                       ▼
       React / Next.js Client     Real-time handlers
                │
                │ REST API
                ▼
       Express + TypeScript API
                │
       ┌────────┼─────────┬─────────────┐
       │        │         │             │
       ▼        ▼         ▼             ▼
   MongoDB    Redis    Cloudinary     Stripe
   /Mongoose            / Media       / Payments
       │
       ▼
  Domain models and
  business invariants
```

The repository is split into two independently runnable applications:

``` text
/
├── client/       # React/Next.js frontend
├── server/       # Express + TypeScript backend
├── README.md
├── client/README.md
└── server/README.md
```

The client is responsible for presentation, routing, local UI state, API
consumption, and user experience. The server remains authoritative for
authentication, authorization, validation, business rules, persistence,
inventory, financial state, and payment verification.

## Domain Architecture

  -----------------------------------------------------------------------
  Domain                              Responsibility
  ----------------------------------- -----------------------------------
  Authentication / Users              Registration, activation, login,
                                      sessions, password recovery,
                                      account management

  Shops                               Seller identity, shop profile,
                                      payout information

  Products                            Catalog, pricing, stock,
                                      categories, media, reviews

  Events                              Seller promotional/event listings
                                      and management

  Cart                                User-scoped shopping state and
                                      availability checks

  Orders                              Checkout, shop-specific orders,
                                      fulfillment, refunds, order history

  Payments                            COD, Stripe PaymentIntents, payment
                                      confirmation, webhooks

  Coupons                             Seller-owned discount codes and
                                      checkout validation

  Conversations / Messages            Buyer-seller communication and
                                      real-time updates

  Withdrawals                         Seller payout requests and
                                      administrative processing

  Notifications                       User-facing operational
                                      notifications and read/unread state

  Administration                      Platform-level management and
                                      moderation
  -----------------------------------------------------------------------

## Technology Stack

### Frontend

-   React / Next.js
-   JavaScript / TypeScript where applicable
-   Redux Toolkit
-   RTK Query
-   React Hook Form
-   Zod where used for client-side validation
-   Tailwind CSS and existing component styling
-   Socket.IO client

### Backend

-   Node.js
-   Express.js
-   TypeScript
-   MongoDB
-   Mongoose
-   Zod
-   JWT / HTTP-only cookie authentication
-   bcryptjs
-   Redis
-   Stripe
-   Cloudinary
-   Socket.IO
-   Nodemailer
-   Helmet
-   CORS middleware

### Infrastructure

-   Vercel
-   MongoDB Atlas
-   Redis-compatible managed service
-   Cloudinary
-   Stripe
-   GitHub

## Prerequisites

Install:

-   Node.js and npm
-   MongoDB access
-   Redis access
-   Git

For complete end-to-end functionality, also configure:

-   Cloudinary
-   Stripe
-   SMTP/email delivery

Stripe test credentials should be used for local development.

## Local Development

### 1. Clone the repository

``` bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Configure the backend

``` bash
cd server
npm install
```

Create:

``` text
server/.env
```

At minimum, configure the variables required by
`server/src/config/env.ts`.

Typical local configuration includes:

``` env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/mercovia
```

Also configure the authentication, Redis, Cloudinary, Stripe, SMTP, and
other service-specific variables required by the current backend
configuration.

Do not commit `.env`.

### 3. Configure the frontend

``` bash
cd ../client
npm install
```

Create:

``` text
client/.env.local
```

Configure the backend API URL:

``` env
NEXT_PUBLIC_SERVER_URI=http://localhost:3001/api/v1
```

Only browser-safe values may use the `NEXT_PUBLIC_` prefix. Never expose
database credentials, JWT secrets, Stripe secret keys, Cloudinary
secrets, SMTP passwords, or other server secrets through frontend
environment variables.

### 4. Run the backend

``` bash
cd server
npm run dev
```

Typical local API:

``` text
http://localhost:3001
```

### 5. Run the frontend

In a second terminal:

``` bash
cd client
npm run dev
```

Typical local frontend:

``` text
http://localhost:3000
```

### 6. Open the application

Visit:

``` text
http://localhost:3000
```

The backend and frontend are separate processes and must both be running
for authenticated and data-backed functionality.

## Verifying the Setup

Start both applications and verify:

1.  The frontend loads without build/runtime errors.
2.  The backend starts and connects to MongoDB.
3.  API requests point to the expected backend origin.
4.  Authentication cookies are being set and sent.
5.  Product listing loads from the backend.
6.  Seller and buyer protected routes redirect correctly.
7.  Socket.IO connects when messaging is opened.
8.  Stripe flows use test credentials when enabled.

A basic API health check, if enabled by the current backend:

``` bash
curl http://localhost:3001/test
```

## Admin Provisioning

The repository contains an operational admin seeding flow.

Configure in `server/.env`:

``` env
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

Then:

``` bash
cd server
npm run seed:admin
```

The script creates the admin account if it does not exist or promotes an
existing user.

Never commit admin credentials.

For production, run the seed operation deliberately against the
production database rather than exposing an unauthenticated public
admin-creation endpoint.

## Authentication Model

Authentication is server-managed and uses HTTP-only cookies.

The client does not treat a visible frontend state as proof of
authorization. The backend validates the authenticated identity for
protected operations.

High-level flow:

``` text
Registration
    ↓
Activation
    ↓
Login
    ↓
Authenticated HTTP-only session
    ↓
Current-user/session resolution
    ↓
Role-aware protected routes
```

Roles include:

-   `user`
-   `seller`
-   `admin`

Seller-owned resources additionally require ownership checks where
applicable.

## Buyer Flow

``` text
Visitor
  ↓
Browse products / shops
  ↓
Register
  ↓
Activate account
  ↓
Login
  ↓
Browse / search / filter
  ↓
Product details
  ↓
Add to user-scoped cart
  ↓
Revalidate availability
  ↓
Checkout
  ↓
Payment / COD
  ↓
Shop-specific order creation
  ↓
Order confirmation
  ↓
Track fulfillment
  ↓
Refund / review / messaging when eligible
```

## Seller Flow

``` text
Seller registration
  ↓
Account activation
  ↓
Seller login
  ↓
Seller dashboard
  ↓
Configure shop / payout details
  ↓
Create products / events
  ↓
Manage catalog and coupons
  ↓
Receive buyer orders
  ↓
Update fulfillment status
  ↓
Delivery / seller balance workflow
  ↓
Request withdrawal
  ↓
Track payout status
```

## Admin Flow

``` text
Admin provisioning
  ↓
Admin login
  ↓
Protected admin area
  ↓
Review marketplace data
  ↓
Manage users / sellers / products / events
  ↓
Review orders / withdrawals
  ↓
Perform authorized moderation / corrective operations
```

## Payments

Mercovia supports:

-   Cash on Delivery
-   Stripe PaymentIntent-based online payment

The backend is the payment trust boundary.

Client-supplied payment success must never be treated as authoritative.
Stripe confirmation and verified webhook events are used to establish
payment state.

For local Stripe testing, use Stripe test-mode credentials.

## Inventory and Order Integrity

Marketplace checkout is multi-shop aware. Items belonging to different
sellers may produce separate order records.

Inventory-sensitive operations use server-side availability checks and
atomic database behavior where required.

Financially sensitive operations such as seller balances and withdrawals
should not rely on unsafe read-modify-write patterns.

## Real-Time Messaging

Messaging combines:

-   REST APIs for persistence and retrieval
-   Socket.IO for real-time communication
-   conversation/message domain models
-   presence/read-state functionality where enabled

The real-time layer should be tested together with the authenticated
HTTP API rather than in isolation.

## Media

Cloudinary is used for supported user, seller, product, event, and
messaging media.

The application server should not become the permanent storage layer for
uploaded media. Persistent media references should remain externalized.

## Pagination and Caching

List endpoints are designed around pagination to avoid unbounded
responses as marketplace data grows.

RTK Query provides:

-   request caching
-   request deduplication
-   tag-based invalidation
-   mutation synchronization

The frontend should not duplicate server state in unrelated Redux slices
without a concrete reason.

## Security Practices

The application uses production-oriented controls including:

-   HTTP-only authentication cookies
-   role-based authorization
-   seller ownership checks
-   server-side request validation
-   password hashing
-   controlled CORS
-   Helmet/security middleware
-   rate limiting where configured
-   payment verification
-   protected admin routes
-   environment-based secrets
-   Cloudinary for external media storage

The frontend is not a security boundary.

## Production Deployment

### Frontend

The frontend can be deployed independently to Vercel.

Configure the production backend URL through the appropriate
`NEXT_PUBLIC_*` variable.

### Backend

The backend can be deployed as a separate service compatible with the
project's Express/Vercel deployment setup.

Configure:

-   production MongoDB
-   Redis
-   frontend origin
-   authentication secrets
-   Cloudinary
-   Stripe
-   SMTP
-   deployment-specific environment variables

### Database

MongoDB Atlas is suitable for the production database.

Verify:

-   network access
-   database user permissions
-   indexes
-   backup policy
-   connection string correctness

### Stripe

Configure the production webhook endpoint and signing secret. Verify
raw-body webhook handling before enabling real payments.

## Production Checklist

-   [ ] `NODE_ENV` configured for production
-   [ ] production MongoDB URI configured
-   [ ] Redis configured
-   [ ] exact production frontend origin configured
-   [ ] strong authentication secrets configured
-   [ ] Cloudinary configured
-   [ ] Stripe secret and webhook signing secret configured
-   [ ] SMTP configured
-   [ ] admin account provisioned securely
-   [ ] CORS verified
-   [ ] HTTP-only secure cookies verified
-   [ ] no secrets committed
-   [ ] database indexes verified
-   [ ] payment webhook tested
-   [ ] buyer flow tested
-   [ ] seller flow tested
-   [ ] admin flow tested
-   [ ] direct URL/deep-link navigation tested
-   [ ] loading/error/empty states tested

## Troubleshooting

### CORS / 403 errors

Verify the backend frontend-origin configuration exactly matches the
browser origin.

### Authentication works but refresh logs the user out

Check:

-   HTTP-only cookie attributes
-   frontend API URL
-   backend CORS credentials configuration
-   frontend origin
-   HTTPS configuration in production

### MongoDB connection errors

Check:

-   `MONGO_URI`
-   credentials
-   URL encoding for special characters
-   MongoDB Atlas network access
-   database user permissions

### Redis errors

Verify the Redis URL/credentials and TLS configuration required by the
provider.

### Cloudinary uploads fail

Verify Cloudinary cloud name, API key, API secret, upload configuration,
and client-side upload handling.

### Stripe payment fails

Use test keys locally and verify the PaymentIntent flow, backend secret
key, client configuration, and webhook signing secret.

### Messaging does not update in real time

Verify:

-   Socket.IO server
-   authenticated session
-   client socket URL
-   browser network connection
-   backend socket handlers

### Admin routes are inaccessible

Verify that the authenticated user has `role: "admin"` and that both the
backend authorization and frontend route protection are operating
against the current session.

## Engineering Standards

The project favors:

-   domain-oriented modules
-   explicit API contracts
-   server-side authorization
-   validation at the API boundary
-   centralized error handling
-   RTK Query for server state
-   pagination for list endpoints
-   atomic operations for concurrency-sensitive state
-   external media storage
-   explicit loading/error/empty UI states
-   environment-based configuration
-   small, focused modules

## Project Documentation

-   [`client/README.md`](./client/README.md) --- frontend architecture
    and setup
-   [`server/README.md`](./server/README.md) --- backend architecture,
    configuration, API and operations
-   Project case study --- architecture, workflows, database design,
    security and production-readiness rationale

## Production Boundary

Mercovia is a production-oriented portfolio system. That does not imply
that every enterprise concern is implemented.

For example, a full enterprise deployment may additionally require
dedicated observability infrastructure, formal disaster recovery,
advanced fraud detection, large-scale analytics, secrets management
infrastructure, compliance controls, automated release governance, and
dedicated operational support.

Those concerns should not be represented as implemented unless they
actually exist in the system.
