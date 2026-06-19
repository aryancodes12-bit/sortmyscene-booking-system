# 🎭 SortMyScene — Event Seat Booking System

> **Full Stack Hiring Assignment** · MERN Stack   
> Built by **Aryan Jaiswal** · Submitted to SortMyScene

[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Tests](https://img.shields.io/badge/Tests-2%2F2%20Passing-brightgreen)](#testing)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)](https://jwt.io)

---

## What This Is

A production-minded full-stack event ticket booking system where users can browse nightlife events, select seats visually, hold them for 10 minutes, and confirm their booking — all without any two users ever booking the same seat, even under concurrent load.
---
## Features

* User registration and JWT-based authentication
* Curated event discovery
* Backend-driven event pricing and presentation metadata
* Live seat availability
* Multiple-seat selection
* Ten-minute temporary seat reservations
* Countdown driven by the server-generated `expiresAt` timestamp
* Transactional reservation and booking confirmation
* Double-booking prevention under concurrent requests
* Reservation ownership validation
* MongoDB TTL index with lazy expired-seat cleanup
* Reservation state preserved across page refreshes
* Conflict and expiry recovery in the frontend
* Responsive nightlife-themed interface
* Authentication rate limiting
* Automated concurrency and reservation-expiry tests

---

## Tech Stack

### Frontend

* React 19
* Vite
* React Router
* Axios
* Tailwind CSS
* Lucide React
* Context API
* Custom React hooks

### Backend

* Node.js 22
* Express 5
* MongoDB Atlas
* Mongoose
* JSON Web Tokens
* bcryptjs
* Helmet
* CORS
* express-rate-limit
* Morgan

### Testing and Tooling

* Supertest
* Node.js Test Runner
* Nodemon
* ESLint
* Git and GitHub

---

## Screenshots

### Home — Event Discovery

![SortMyScene home page](./docs/screenshots/home.png)

### Authentication

![SortMyScene authentication page](./docs/screenshots/auth.png)

### Seat Selection

![Event seat selection grid](./docs/screenshots/seat-selection.png)

### Reservation Countdown

![Active ten-minute reservation countdown](./docs/screenshots/reservation-countdown.png)

### Booking Confirmed

![Successful booking confirmation](./docs/screenshots/booking-confirmed.png)

## For technical proof:
### MongoDB Atlas — Collections View
![MongoDB Atlas event collection](./docs/screenshots/mongodb-atlas.png)

Event details, pricing, categories, themes, and seat capacity are stored in MongoDB and returned through the REST API.

### Double Booking Prevention — 409 Conflict
![409 conflict during concurrent seat reservation](./docs/screenshots/double-booking-409.png)

Two users attempted to reserve the same seat. The first reservation succeeded, while the competing request received `409 SEATS_UNAVAILABLE`.

### Tests Passing — 2/2
![Backend integration tests passing](./docs/screenshots/tests-passing.png)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Client                          │
│   EventList → EventDetail → SeatGrid → Reserve → Confirm    │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTP / JSON (Axios)
                        │  Authorization: Bearer <JWT>
┌───────────────────────▼─────────────────────────────────────┐
│                   Express REST API                           │
│   /auth  /events  /reserve  /bookings                        │
│   Helmet · CORS · Rate Limiting · Morgan                     │
└───────────────────────┬─────────────────────────────────────┘
                        │  Mongoose (with Sessions)
┌───────────────────────▼─────────────────────────────────────┐
│                   MongoDB Atlas                              │
│   Events · Seats · Reservations · Users                     │
│   Replica Set → Transactions Enabled                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Booking Flow

```
User opens event
       │
       ▼
┌─────────────┐
│ Seat Grid   │  Green = available, Amber = reserved, Red = booked
│ (live view) │
└──────┬──────┘
       │  User clicks seats
       ▼
┌─────────────────────┐
│ POST /api/reserve   │
│                     │
│ MongoDB Transaction │───── Seat status = 'available'? ──── NO ──▶ 409 Conflict
│ updateMany()        │                                              (shown in UI)
│ modifiedCount check │
└──────┬──────────────┘
       │ YES — all seats locked
       ▼
┌─────────────────────────┐
│ 10-min Countdown Timer  │  (server expiresAt — not client clock)
│ Reservation held in DB  │
└──────┬──────────────────┘
       │  User clicks Confirm
       ▼
┌─────────────────────┐
│ POST /api/bookings  │
│                     │
│ Validates:          │
│  ✓ Reservation exists│
│  ✓ Belongs to user  │
│  ✓ Not expired      │───── Expired? ──▶ 410 Gone (seats auto-released)
│  ✓ Seats still held │
└──────┬──────────────┘
       │
       ▼
  ✅ Booking Confirmed
     Seats → 'booked'
     Reservation removed
```

---

## Double Booking Prevention — The Core Logic

This is the most critical part of the system. Here's exactly how it works:

### The Problem
Two users select the same seat at the same moment. Without protection, both could succeed.

### The Solution — MongoDB Transaction + Conditional Update

```js
// backend/src/controllers/reservation.controller.js — simplified
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Atomic conditional update — ONLY updates seats still 'available'
  const result = await Seat.updateMany(
    {
      eventId,
      seatNumber: { $in: seatNumbers },
      status: "available"          // ← The guard condition
    },
    { $set: { status: "reserved", reservationId, reservedUntil: expiresAt } },
    { session }                    // ← Inside transaction
  );

  // If ANY seat was already taken, modifiedCount < requested
  if (result.modifiedCount !== seatNumbers.length) {
    throw new ApiError(409, "SEATS_UNAVAILABLE",
      "One or more selected seats are no longer available");
  }

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction(); // ← No partial state retained
  throw err;
}
```

**Why this works under concurrency:**
- MongoDB processes `updateMany` atomically per document
- The `status: "available"` filter means the second request finds 0 matching seats
- The transaction ensures no partial reservation is ever saved
- `modifiedCount` mismatch triggers an immediate rollback

---

## Reservation Expiry — Two-Layer Design

A single expiry mechanism isn't enough. This system uses two:

```
Layer 1: MongoDB TTL Index (automatic)
─────────────────────────────────────
ReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
→ MongoDB removes expired Reservation documents every ~60 seconds

Layer 2: Lazy Cleanup (before every operation)
──────────────────────────────────────────────
Before GET /events/:id   → release expired reserved seats
Before POST /reserve     → release expired reserved seats
Before POST /bookings    → validate expiresAt explicitly

Why both?
TTL removes the Reservation document but does NOT update Seat documents.
Lazy cleanup ensures seats return to 'available' even before TTL fires.
Result: Zero stale 'reserved' seats visible to users.
```

---

## Project Structure

```
sortmyscene-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB Atlas connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── Reservation.js 
│   │   │   └── booking.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js          # JWT verification
│   │   │   └── errorHandler.js    # Centralized error handling
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   ├── Seat.js           
│   │   │   └── reservation.controller.js    # TTL index lives here
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   ├── reserve.js
│   │   │   └── bookings.js
│   │   ├── services/
│   │   │   └── releaseExpiredSeats.js  # Transaction logic
│   │   ├── utils/
│   │   │   └── ApiError.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   └── booking-flow.test.js       # Concurrent + expiry tests
│   ├── seed.js                    # Creates 3 events + 300 seats
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js           # Axios instance + interceptors
│   │   ├── components/
│   │   │   ├── booking/
│   │   │   │   ├── SeatGrid.jsx
│   │   │   │   └── CountdownTimer.jsx
│   │   │   └── events/
│   │   │       └── EventCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT + user state
│   │   ├── hooks/
│   │   │   └── useReservation.js  # Reservation business logic
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   └── Auth.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── screenshots/
└── README.md
```

---

## API Reference

**Base URL (local):** `http://localhost:5000/api`

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | API status + timestamp |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login → JWT |
| GET | `/auth/me` | Bearer | Get current user |

**Register:**
```json
{ "name": "Aryan Jaiswal", "email": "aryan@example.com", "password": "SecurePass123" }
```

**Login response:**
```json
{ "token": "eyJhbGci...", "user": { "id": "...", "name": "Aryan Jaiswal" } }
```

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | No | All events with seat counts |
| GET | `/events/:id` | No | Event + live seat grid |

### Reserve
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reserve` | Bearer | Lock seats for 10 minutes |

**Request:**
```json
{ "eventId": "6650a1b2c3d4e5f6a7b8c9d0", "seatNumbers": ["A3", "A4"] }
```

**Success (201):**
```json
{
  "reservation": {
    "_id": "...",
    "expiresAt": "2025-06-20T18:10:00.000Z",
    "seatNumbers": ["A3", "A4"]
  }
}
```

**Error responses:**
| Status | Code | Cause |
|--------|------|-------|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 409 | `SEATS_UNAVAILABLE` | Seat taken by another user |
| 422 | `VALIDATION_ERROR` | Bad request body |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | Bearer | Confirm reservation → booked |

**Request:**
```json
{ "reservationId": "6650a1b2c3d4e5f6a7b8c9d1" }
```

**Error responses:**
| Status | Code | Cause |
|--------|------|-------|
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Reservation belongs to another user |
| 410 | `RESERVATION_EXPIRED` | Timer ran out |

---

## Local Setup

### Prerequisites
- Node.js 22+
- npm
- MongoDB Atlas account (free tier works) **or** local MongoDB replica set

> ⚠️ MongoDB transactions require a **replica set**. MongoDB Atlas provides this by default. A standalone local MongoDB will not work.

---

### 1. Clone

```bash
git clone https://github.com/aryancodes12-bit/sortmyscene-booking-system.git
cd sortmyscene-booking-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/sortmyscene_booking?retryWrites=true&w=majority

JWT_SECRET=replace_with_a_long_random_secret_minimum_32_chars
JWT_EXPIRES_IN=7d

CLIENT_URLS=http://localhost:5173
```

### 3. Seed the Database

```bash
npm run seed
```

Expected output:
```
✅ Seed complete: 3 events and 300 seats created
```

### 4. Start Backend

```bash
npm run dev
```

Verify it's running:
```
http://localhost:5000/api/health
```

### 5. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env   # or Copy-Item on Windows
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start Frontend

```bash
npm run dev
```

Open: `http://localhost:5173`

---

## Available Commands

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with Nodemon (hot reload) |
| `npm start` | Start with Node.js |
| `npm run seed` | Reset + seed development data |
| `npm test` | Run integration tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

---

## Testing

```bash
cd backend
npm test
```

### What the tests verify

**Test 1 — Concurrent Reservation (Double Booking)**
Two users attempt to reserve the same seat at the exact same moment.
Only one succeeds with `201`. The other receives `409 SEATS_UNAVAILABLE`.
No seat ends up double-reserved.

**Test 2 — Expired Reservation Booking**
A reservation is created and its `expiresAt` is manually set to the past.
Attempting to confirm it returns `410 RESERVATION_EXPIRED`.
The seat is released back to `available`.

**Expected output:**
```
▶ Booking Flow Integration Tests
  ✔ Two concurrent users cannot reserve the same seat (243ms)
  ✔ Expired reservation cannot be booked and seat is released (187ms)

tests 2
pass  2
fail  0
```

> Note: Handled `409` and `410` errors appear in output — these are **expected** and confirm the protection is working, not test failures.

---

## Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs |
| Authentication | Signed JWT access tokens |
| UI error handling | Structured loading, conflict and expiry states |
| Rate limiting | express-rate-limit on `/auth/*` |
| Security headers | Helmet.js |
| CORS | Allowlist via `CLIENT_URLS` env var |
| Body size limit | 10kb request cap |
| Ownership check | Reservation `userId` verified before booking |
| Error messages | Never expose stack traces in production |

---

## Design Decisions

### Why MongoDB Transactions?
Seat reservation is a classic race condition problem. `updateMany` with a conditional filter (`status: "available"`) inside a transaction guarantees atomicity — either all requested seats are reserved together, or none are. There is no in-between state.

### Why Two Expiry Layers?
MongoDB's TTL index removes the `Reservation` document but has no awareness of the `Seat` collection. Without lazy cleanup, a seat could remain visually "reserved" for up to 60 seconds after expiry. Lazy cleanup before read and write operations eliminates this gap entirely.

### Why Server-Side `expiresAt` for the Timer?
A client-side timer drifts. If the user's clock is wrong, the frontend and backend disagree on when the reservation expires. Using the server's `expiresAt` timestamp in the frontend countdown ensures they are always in sync.

### Why Context API over Redux?
The application state is shallow — user auth and reservation status. Context API with hooks handles this cleanly without the boilerplate overhead of Redux. For a larger application with deeply nested state, Redux Toolkit would be the right call.

### Why `modifiedCount` Check?
After `updateMany`, MongoDB returns how many documents were actually modified. If the count is less than the seats requested, at least one seat was no longer `available`. This is the signal to abort the transaction and return `409`.

---

## Assignment Requirements Checklist

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| `GET /api/events` | ✅ | Lists all events with available seat count |
| `GET /api/events/:id` | ✅ | Returns event + full seat grid with live statuses |
| `POST /api/reserve` | ✅ | Atomic transaction, 10-min expiry, conditional update |
| `POST /api/bookings` | ✅ | Validates ownership, expiry, and seat state |
| Prevent double booking | ✅ | MongoDB transaction + `modifiedCount` guard |
| Expired reservation blocked | ✅ | Explicit `expiresAt` check + lazy cleanup |
| Seat grid with colour coding | ✅ | Green / Purple / Amber / Red |
| Countdown timer | ✅ | Driven by server `expiresAt` timestamp |
| Error on unavailable seat | ✅ | 409 shown in UI between selection and reservation |
| Basic user authentication | ✅ | JWT register + login + protected routes |
| Component-based architecture | ✅ | Reusable SeatGrid, CountdownTimer, EventCard |
| State management (hooks) | ✅ | useState, useEffect, useContext, custom hooks |
| Async API calls | ✅ | AAxios API client with structured loading and error states |
| README | ✅ | You are reading it |

---

## Repository

**GitHub:** [github.com/aryancodes12-bit/sortmyscene-booking-system](https://github.com/aryancodes12-bit/sortmyscene-booking-system)

---

## Author

**Aryan Jaiswal**  
GitHub: [@aryancodes12-bit](https://github.com/aryancodes12-bit)

*Submitted to SortMyScene · Full Stack Developer Hiring Assignment · June 2026*