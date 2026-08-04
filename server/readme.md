# Server — Multi Vendor E-Commerce API

![Node.js](https://img.shields.io/badge/Node.js-≥24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-black?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?logo=redis&logoColor=white)

Production-ready REST API for a **Multi Vendor E-Commerce** platform built with **Express 5**, **TypeScript**, **MongoDB**, and **Redis**. It provides authentication, shop management, product & event management, orders, conversations, messaging, coupons, withdrawals, payment processing, and media uploads.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Running & Verifying](#running--verifying)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Authentication & Session Management](#authentication--session-management)
- [Payments](#payments)
- [Media Storage](#media-storage)
- [Security](#security)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

## Tech Stack

- **Runtime:** Node.js, TypeScript, native ESM (`"type": "module"`, `NodeNext` resolution)
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose 9
- **Cache & Session Store:** Redis via `ioredis`
- **Authentication:** JWT Access & Refresh Tokens, bcryptjs password hashing
- **Media Storage:** Cloudinary
- **Payments:** Stripe Payment Intents API
- **Email:** Nodemailer
- **Security:** Helmet, CORS, Express Rate Limit, CSRF Origin Validation
- **Validation:** Zod

## Folder Structure

```text
server/
└── src/
    ├── config/            # Database, Redis, Cloudinary and environment configuration
    ├── controllers/       # Business logic
    ├── middlewares/       # Auth, rate limiting, error handling
    ├── models/            # Mongoose schemas
    ├── routes/            # API endpoints
    ├── types/             # Shared TypeScript types
    ├── utils/             # Helper utilities
    ├── app.ts             # Express application
    └── server.ts          # Server bootstrap
```

## Prerequisites

- Node.js ≥ 24
- MongoDB
- Redis
- Cloudinary account
- Stripe account
- SMTP credentials

## Setup

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create a `.env` file with the required configuration.

Typical variables include:

- PORT
- FRONTEND_URL
- MONGO_URI
- REDIS_URL
- ACCESS_TOKEN
- REFRESH_TOKEN
- ACCESS_TOKEN_EXPIRE
- REFRESH_TOKEN_EXPIRE
- JWT_SECRET_KEY
- JWT_EXPIRES
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- SMTP_SERVICE
- SMTP_MAIL
- SMTP_PASSWORD
- SMTP_HOST
- SMTP_PORT
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_CURRENCY
- COMPANY_NAME

## Scripts

```bash
npm run dev
npm run build
npm start
```

## Running & Verifying

```bash
npm run dev
```

Health endpoint:

```
GET /health
```

## API Reference

All endpoints are available under:

```
/api/v1
```

Modules include:

- User
- Shop
- Product
- Event
- Order
- Conversation
- Message
- Coupon
- Withdraw
- Payment

## Data Models

- User
- Shop
- Product
- Event
- Order
- Conversation
- Message
- Coupon
- Withdraw Request

## Authentication & Session Management

- JWT Access Tokens
- Refresh Token Flow
- HTTP-only Secure Cookies
- Redis-backed Sessions
- Role-based Authorization
- Seller Authentication

## Payments

Stripe Payment Intents are used for secure payment processing.

## Media Storage

Cloudinary is used for storing:

- Product Images
- Event Images
- User Avatars
- Shop Avatars

The backend supports:

- Concurrent uploads
- Automatic rollback on upload failures
- Concurrent asset deletion

## Security

- Helmet
- CORS
- Rate Limiting
- CSRF Origin Protection
- Secure Cookies
- Refresh Token Rotation
- Centralized Authorization
- MongoDB Indexes
- Health/Readiness Endpoint
- Graceful Shutdown

## Error Handling

All controllers use centralized error handling to return consistent JSON error responses.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection failed | Verify `MONGO_URI` |
| Redis connection failed | Verify `REDIS_URL` |
| Cloudinary upload failed | Verify Cloudinary credentials |
| Stripe payment failed | Verify Stripe API keys |
| CORS blocked | Check `FRONTEND_URL` |
| Build failed | Run `npm run build` and fix TypeScript errors |