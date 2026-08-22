# Mercovia Socket Relay

> Standalone Socket.IO service providing real-time delivery for
> Mercovia — chat messages, presence, and live operational
> notifications — decoupled from the stateless REST API.

For system-wide architecture and how this service fits into the full
request/event flow, see the
[root README's architecture section](../README.md#system-architecture).

## Why this is a separate service

The [`server`](../server/README.md) process is a stateless HTTP API: it
handles a request and returns a response. Socket.IO connections are the
opposite — long-lived, stateful, and tied to a specific process
instance for their lifetime. Putting both in one process couples their
scaling and deployment characteristics for no benefit: restarting the
API to ship an unrelated bug fix would drop every open chat connection,
and scaling the API for request throughput would fragment socket rooms
across instances with no shared state.

`socket-relay` solves this by being the *only* process that holds
WebSocket connections. It has no direct database access and no business
logic of its own — it only:

1.  authorizes a connection using a short-lived ticket issued by
    `server`,
2.  tracks presence,
3.  relays a small set of purely peer-to-peer socket events
    (`messageSeen`), and
4.  subscribes to a Redis channel that `server` publishes
    domain events to, and re-emits them to the right connected
    client(s).

This keeps the REST API free of connection state (so it can restart,
scale, or even move to a serverless-style deployment without affecting
open sockets) while giving every backend controller a simple,
fire-and-forget way to notify a specific user in real time.

## Architecture

```text
server (Express API)
   │  publishSocketEvent(identityId, event, payload)
   ▼
Redis channel: socket_events
   │
   ▼
socket-relay
   │  io.to(identityId).emit(event, payload)
   ▼
Browser (Socket.IO client, connected via a room keyed by
its own user/seller/admin id)
```

`socket-relay` joins every connecting socket to three kinds of rooms:

-   a room named after the connecting identity's own id (so
    `publishSocketEvent(userId, ...)` reaches exactly that user, across
    every open tab/device)
-   a shared `"public"` room (used for broadcast events like
    `stockUpdated`, which every shopper's cart/PDP should react to)
-   a shared `"admin"` room, joined only if the identity's role is
    `admin` (used for admin dashboard notifications like new orders,
    new sellers, and withdrawal requests)

### Horizontal scaling

`socket-relay` uses [`@socket.io/redis-adapter`](https://github.com/socketio/socket.io-redis-adapter)
(`createAdapter(pubClient, subClient)` in `src/index.ts`). This means
`io.to(room).emit(...)` broadcasts correctly across *multiple*
`socket-relay` replicas, not just within a single process — a
prerequisite for running more than one instance behind a load balancer
with sticky sessions disabled. The current production deployment runs a
single replica, but the adapter is already wired for horizontal scaling
without further code changes.

## Authentication: single-use tickets

`socket-relay` never sees a user's password or long-lived session
cookie. Instead:

1.  The authenticated browser calls
    `POST /api/v1/socket/ticket` on the main API (cookie-authenticated,
    same-origin — see `server/src/controllers/socket.controller.ts`).
2.  `server` mints a random ticket, stores
    `socket_ticket:<ticket> → { role, id, name, avatar }` in Redis with
    a **30-second TTL** (`server/src/utils/socketTicket.ts`), and
    returns the ticket string.
3.  The Socket.IO client (`client/lib/socket.ts`) connects to
    `socket-relay` with `{ auth: { ticket } }`.
4.  `socket-relay`'s auth middleware (`src/auth.ts`) looks up the
    ticket in Redis, **deletes it immediately** (single-use — a
    replayed or intercepted ticket cannot be reused), and attaches the
    decoded identity to `socket.data.identity`. A missing, expired, or
    already-consumed ticket rejects the connection.

This bounds the blast radius of a leaked ticket to 30 seconds and one
connection attempt, without `socket-relay` needing to verify JWTs or
share the API's signing secrets.

## Structure

```text
socket-relay/src/
├── index.ts       # entrypoint: Redis adapter wiring, auth middleware,
│                  # connection handling, socket_events subscription
├── auth.ts        # ticket validation middleware
├── presence.ts     # online-user tracking (Redis hash) + getUsers broadcast
├── chat.ts         # messageSeen relay between two connected peers
└── types.ts        # shared Socket.IO event typings
```

## Responsibilities

-   validate connection tickets and reject unauthenticated sockets
-   join sockets to identity/`public`/`admin` rooms
-   track and broadcast online presence (`getUsers`) via a Redis hash,
    incrementing/decrementing a per-user connection count so multiple
    tabs/devices don't cause spurious online/offline flapping
-   relay `messageSeen` receipts directly between the two participants
    of a conversation (no persistence needed — the underlying "seen"
    state lives in MongoDB, updated via the REST API)
-   subscribe to the `socket_events` Redis channel and fan events out
    to the correct room(s)

## What it deliberately does NOT do

-   no database access (MongoDB or otherwise)
-   no business logic or validation
-   no persistence — every event it relays was already (or will be)
    persisted by `server` via the REST API
-   no JWT verification — trusts only Redis-issued, single-use tickets

## Environment Variables

```env
PORT=4000
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```

| Variable | Required | Notes |
|---|---|---|
| `PORT` | — | Defaults to `3001` if unset — **set this explicitly** to avoid colliding with the `server` service, which defaults to the same port. Production uses `4000`. |
| `REDIS_URL` | **yes** | Must point at the **same** Redis instance/database as `server` — this is how the two processes communicate. The process exits immediately if unset. |
| `FRONTEND_URL` | — | Comma-separated list of allowed CORS/Socket.IO origins. If unset, CORS allows any origin (`origin: true`) — set this explicitly in any shared or production environment. |

## Local Setup

```bash
cd socket-relay
npm install
npm run dev
```

Requires a reachable Redis instance at `REDIS_URL`, and ideally a
running `server` instance pointed at the same Redis so tickets it
issues are honored here. `npm run dev` runs `tsx watch src/index.ts`.

## Docker

```bash
cd socket-relay
docker build -t mercovia-socket-relay .
docker run -p 4000:4000 \
  -e PORT=4000 \
  -e REDIS_URL=redis://<redis-host>:6379 \
  -e FRONTEND_URL=https://mercovia.online \
  mercovia-socket-relay
```

In the full stack, this is built and run via the root
[`docker-compose.yml`](../docker-compose.yml) as the `socket-relay`
service, alongside `mongodb`, `redis`, `server`, and `client`. See the
[root README's AWS deployment section](../README.md#aws-production-deployment)
for how it's exposed publicly at `socket.mercovia.online` through
Nginx, including the WebSocket-specific proxy settings
(`Upgrade`/`Connection` headers, long `proxy_read_timeout`/
`proxy_send_timeout`).

## Health

The container's `Dockerfile` does not define an HTTP health endpoint
(Socket.IO's HTTP surface isn't meant for polling); container health is
inferred from process liveness. `docker compose ps` and
`docker compose logs socket-relay` are the primary operational
diagnostics.

## Troubleshooting

**Sockets fail to connect / immediate disconnect:** check
`REDIS_URL` matches `server`'s, confirm `POST /api/v1/socket/ticket`
succeeds first (it requires an authenticated session), and check the
ticket isn't older than 30 seconds by the time the socket handshake
reaches this service (slow networks/clock skew can matter here).

**Events published by `server` never arrive:** confirm both processes
point at the same Redis instance and the same logical database/URL —
there is no other communication path between them.

**CORS/WebSocket upgrade failures behind Nginx:** verify the Nginx
`location` block for `socket.mercovia.online` forwards `Upgrade` and
`Connection: upgrade` headers (see
[`deploy/nginx/mercovia.conf`](../deploy/nginx/mercovia.conf)).

**Presence looks wrong (user shown online after closing all tabs):**
check `src/presence.ts`'s Redis hash (`socket:online_counts`) — this
should self-correct on `disconnect`, but a Redis flush or an unclean
process kill can leave stale counts; restarting `socket-relay` clears
in-memory... note presence state lives in Redis, not memory, so a
restart of this service does *not* clear it — a stuck count would need
manual Redis intervention (`HDEL socket:online_counts <userId>`) or a
Redis restart.

## Related Documentation

-   [`../README.md`](../README.md) — full system architecture,
    Docker/AWS deployment, CI/CD
-   [`../server/README.md`](../server/README.md) — the REST API that
    issues tickets and publishes events to this service
-   [`../client/README.md`](../client/README.md) — the Socket.IO client
    that connects here

