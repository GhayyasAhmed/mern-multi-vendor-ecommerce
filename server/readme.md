# Multi Vendor E-Commerce Backend

Production-ready REST API for a Multi Vendor E-Commerce platform built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB**, and **Redis**.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- Redis (Upstash)
- JWT Authentication
- Cloudinary
- Stripe
- Multer
- Zod
- Helmet
- Express Rate Limit

---

## Features

### Authentication

- User registration & login
- Seller registration & login
- JWT access & refresh token authentication
- Secure HTTP-only cookies
- Password hashing with bcrypt
- Logout
- Token refresh

### Shop Management

- Create shop
- Update shop profile
- Shop information
- Seller dashboard

### Product Management

- Create product
- Update product
- Delete product
- Product listing
- Product reviews
- Cloudinary image uploads

### Events

- Create event
- Update event
- Delete event
- Event listing

### Orders

- Create order
- Order history
- Seller orders
- Update order status
- Refund workflow

### Conversations & Messages

- Create conversation
- Send messages
- Retrieve conversations
- Retrieve messages

### Coupons

- Create coupon
- Update coupon
- Delete coupon
- Coupon validation

### Withdrawals

- Withdrawal request
- Seller withdrawal history

### Payments

- Stripe Payment Intent
- Payment processing

---

## Production Features

- TypeScript
- Centralized error handling
- Environment validation
- Helmet security headers
- CORS configuration
- Rate limiting
- CSRF origin protection
- Refresh token flow
- Secure authentication middleware
- MongoDB indexes
- Graceful shutdown
- Health/Readiness endpoint
- JSON 404 responses
- Concurrent Cloudinary uploads
- Automatic Cloudinary rollback on failures
- Concurrent Cloudinary asset deletion

---

## Project Structure

```
src/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── types/
├── utils/
├── app.ts
└── server.ts
```

---

## Installation

```bash
npm install
```

Create a `.env` file and configure all required environment variables.

---

## Development

```bash
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Start Production Server

```bash
npm start
```

---

## Health Check

```
GET /api/v1/health-check
```

---

## Security

- JWT Authentication
- Refresh Token Rotation
- HTTP-only Cookies
- Helmet
- Rate Limiting
- CORS
- CSRF Origin Validation
- Authorization Middleware
- Input Validation
- Centralized Error Handling

---

## License

ISC