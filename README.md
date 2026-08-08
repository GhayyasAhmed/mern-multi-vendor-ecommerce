Mercovia

Production-oriented multi-vendor e-commerce marketplace demonstratingfull-stack engineering, domain-oriented architecture, secure APIdesign, data integrity, and real-world buyer, seller, and adminworkflows.

Live application: https://mercovia.vercel.app

Overview

Mercovia is a full-stack marketplace where multiple sellers manageproducts, events, orders, coupons, conversations and payouts whilebuyers discover products, maintain a user-scoped cart, check out, trackorders, request supported refunds, submit eligible reviews andcommunicate with sellers. Protected administration supports platformoperations and moderation.

The project is deliberately more than a CRUD exercise. It addresses theboundaries that matter in a marketplace: authentication andauthorization, frontend/backend contract alignment, validation, routeprotection, stock and order integrity, payment verification, sellerbalance integrity, pagination, RTK Query caching, real-time messaging,cloud media and explicit loading/error/empty states.

Architecture

Next.js / React Client
        │ HTTP + HTTP-only cookies + Socket.IO
        ▼
Express + TypeScript API
        │
        ├── Auth / Authorization / Validation
        ├── Domain Controllers / Models
        ├── Stripe / Webhooks
        └── Socket.IO
        │
        ├── MongoDB
        ├── Redis
        └── Cloudinary

The repository is split into independently runnable applications:

/
├── client/       # Next.js frontend
├── server/       # Express + TypeScript backend
├── README.md
├── client/README.md
└── server/README.md

Domains

Domain                              Responsibility

Authentication / Users              Registration, activation, login,sessions, password recovery,account management

Shops                               Seller identity, profile, payoutinformation

Products                            Catalog, inventory, categories,reviews

Events                              Seller promotional/event listings

Cart                                User-scoped shopping state

Orders                              Checkout, fulfillment, refunds,order history

Payments                            Stripe PaymentIntents, paymentverification, webhooks, COD

Coupons                             Seller-owned discount codes andcheckout validation

Conversations / Messages            Buyer-seller communication andreal-time updates

Withdrawals                         Seller payout requests andadministrative processing

Notifications                       Important marketplace events

Administration                      Platform-level management

Roles

Buyer --- browse/search, cart, checkout, orders, refunds, reviews,coupons, account management and seller communication.

Seller --- shop/profile management, products, events, orders,coupons, payouts and buyer communication.

Admin --- protected platform operations across users, sellers,products, events, orders, withdrawals and moderation-related workflows.

Stack

Frontend: Next.js, React, TypeScript/JavaScript, Redux Toolkit, RTKQuery, React Hook Form, Zod, Tailwind CSS, Socket.IO client.

Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, Zod,JWT/HTTP-only cookies, bcryptjs, Redis, Stripe, Cloudinary, Socket.IO,Nodemailer, Helmet and CORS.

Infrastructure: MongoDB Atlas, Redis-compatible service, Cloudinary,Stripe, Vercel and GitHub.

Local Development

Prerequisites

Install Node.js and npm. The complete application also requires accessto MongoDB, Redis, Cloudinary and SMTP. Stripe is required to exerciseonline payment flows.

Backend

cd server
npm install

Create server/.env. Configure the variables required byserver/src/config/env.ts, including the MongoDB URI, frontend origin,authentication configuration, Redis, Cloudinary, Stripe and emailconfiguration.

At minimum the local configuration must include the equivalent of:

NODE_ENV=development
PORT=<server-port>
FRONTEND_URL=http://localhost:<frontend-port>
MONGO_URI=<mongodb-connection-string>

Do not commit secrets. Use the actual variable names defined by thecurrent env.ts configuration for JWT, Redis, Cloudinary, Stripe andSMTP values.

Start the API:

npm run dev

Frontend

In a second terminal:

cd client
npm install

Create client/.env.local:

NEXT_PUBLIC_SERVER_URI=http://localhost:<server-port>/api/v1

Start Next.js:

npm run dev

Use the URL printed by Next.js.

Admin provisioning

From server/.env:

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>

Then:

cd server
npm run seed:admin

The script creates the admin or promotes an existing account. Nevercommit these credentials. For production, provision against theproduction database through a controlled operational process.

Authentication

Authentication uses server-managed HTTP-only cookies. The clientresolves session state through the current-user API and can refresh anexpired access token through the backend. Route protection isimplemented through middleware and client-side defense-in-depth.

For local development, FRONTEND_URL must exactly match the browserorigin or protected POST/PUT flows can fail CORS/origin checks.

Payments

Mercovia supports Cash on Delivery and Stripe PaymentIntents. Stripewebhook verification is the authoritative payment confirmationmechanism; client-supplied payment success must never be treated asproof of payment.

Media and Real-Time Communication

Cloudinary stores user, seller, product and event media. Socket.IOsupports buyer/seller messaging and related real-time events.

Engineering Practices

domain-oriented modularity

typed backend code

server-side validation and authorization

centralized error handling

RTK Query caching/invalidation

paginated list APIs

atomic operations for concurrency-sensitive financial/inventorypaths

protected administrative operations

explicit loading/error/empty states

environment-based secrets

externalized media storage

Production Boundary

This is a production-oriented portfolio system, not an assertion thatevery enterprise capability exists. Full observability platforms,automated disaster recovery, advanced fraud detection, large-scaleanalytics infrastructure and formal enterprise release governance areseparate concerns unless explicitly implemented.

Documentation

client/README.md --- frontend architectureand setup

server/README.md --- backend architecture,configuration and operations

Project case study --- architecture, flows, database design,security and production-readiness rationale

License

Add the project's chosen license here before distributing the repositoryfor external reuse.