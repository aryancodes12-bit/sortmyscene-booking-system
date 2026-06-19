# 🎭 SeatSync — Event Seat Booking System

> **Full Stack Hiring Assignment** · MERN Stack  
> Built by **Aryan Jaiswal** · Submitted to SortMyScene

[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![Tests](https://img.shields.io/badge/Tests-2%2F2%20Passing-brightgreen)](#testing)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)](https://jwt.io)

---

## What This Is

SortMyScene is a production-minded full-stack event seat-booking system. Users can discover nightlife events, inspect live seat availability, reserve multiple seats for ten minutes, and confirm their booking securely.

The core booking flow uses MongoDB transactions, conditional seat updates, and strict reservation validation to ensure that two users cannot reserve or book the same seat.

---

## Features

- User registration and JWT-based authentication
- Curated event discovery
- Backend-driven event pricing and presentation metadata
- Live seat availability
- Multiple-seat selection
- Ten-minute temporary seat reservations
- Countdown driven by the server-generated `expiresAt` timestamp
- Transactional reservation and booking confirmation
- Double-booking prevention under concurrent requests
- Reservation ownership validation
- MongoDB TTL index with lazy expired-seat cleanup
- Reservation state preserved across page refreshes
- Conflict and expiry recovery in the frontend
- Responsive nightlife-themed interface
- Authentication rate limiting
- Automated concurrency and reservation-expiry tests

---

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React
- Context API
- Custom React hooks

### Backend

- Node.js 22
- Express 5
- MongoDB Atlas
- Mongoose
- JSON Web Tokens
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- Morgan

### Testing and Tooling

- Supertest
- Node.js Test Runner
- Nodemon
- ESLint
- Git and GitHub

---

## Screenshots

<table>
  <tr>
    <td width="50%" align="center">
      <strong>Home — Event Discovery</strong><br><br>
      <img src="./docs/screenshots/home.png" alt="SortMyScene home page" width="100%">
    </td>
    <td width="50%" align="center">
      <strong>Authentication</strong><br><br>
      <img src="./docs/screenshots/auth.png" alt="SortMyScene authentication page" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <strong>Seat Selection</strong><br><br>
      <img src="./docs/screenshots/seat-selection.png" alt="Event seat-selection grid" width="100%">
    </td>
    <td width="50%" align="center">
      <strong>Reservation Countdown</strong><br><br>
      <img src="./docs/screenshots/reservation-countdown.png" alt="Active reservation countdown" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <strong>Booking Confirmed</strong><br><br>
      <img src="./docs/screenshots/booking-confirmed.png" alt="Successful booking confirmation" width="100%">
    </td>
    <td width="50%" align="center">
      <strong>MongoDB Atlas</strong><br><br>
      <img src="./docs/screenshots/mongodb-atlas.png" alt="MongoDB Atlas event collection" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <strong>Double-Booking Prevention — 409 Conflict</strong><br><br>
      <img src="./docs/screenshots/double-booking-409.png" alt="Concurrent reservation conflict" width="100%">
    </td>
    <td width="50%" align="center">
      <strong>Automated Tests — 2/2 Passing</strong><br><br>
      <img src="./docs/screenshots/tests-passing.png" alt="Backend integration tests passing" width="100%">
    </td>
  </tr>
</table>

### Technical Evidence

- Event pricing, categories, themes, and seat capacity are stored in MongoDB and returned through the REST API.
- Competing attempts to reserve the same seat result in one successful reservation and one `409 SEATS_UNAVAILABLE` response.
- Integration tests verify concurrency protection and expired-reservation recovery.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        React Client                         │
│   Home → Event Detail → Seat Grid → Reserve → Confirm      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / JSON through Axios
                        │ Authorization: Bearer <JWT>
┌───────────────────────▼─────────────────────────────────────┐
│                    Express REST API                        │
│   /api/auth · /api/events · /api/reserve · /api/bookings  │
│   Helmet · CORS · Rate Limiting · Morgan                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose sessions and transactions
┌───────────────────────▼─────────────────────────────────────┐
│                     MongoDB Atlas                          │
│   Users · Events · Seats · Reservations                    │
│   Replica Set → Transaction Support                        │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Responsibilities

- **React client:** UI, authentication state, seat selection, countdown rendering, conflict recovery, and booking confirmation views.
- **Express API:** authentication, validation, authorization, reservation transactions, booking confirmation, and centralized error responses.
- **MongoDB Atlas:** persistent event data, seat state, temporary reservations, TTL expiry, and transaction guarantees.

---

## Complete Booking Flow

```text
User opens an event
        │
        ▼
┌──────────────────┐
│ Live Seat Grid   │
│ Green: Available │
│ Purple: Selected │
│ Amber: Reserved  │
│ Red: Booked      │
└────────┬─────────┘
         │ User selects one or more seats
         ▼
┌────────────────────────────┐
│ POST /api/reserve          │
│ MongoDB transaction        │
│ Conditional updateMany()   │
│ modifiedCount validation   │
└────────┬───────────────────┘
         │
         ├── Seat unavailable → 409 Conflict
         │
         ▼
┌────────────────────────────┐
│ Ten-minute reservation     │
│ Server-generated expiresAt │
│ Countdown shown in React   │
└────────┬───────────────────┘
         │ User confirms
         ▼
┌────────────────────────────┐
│ POST /api/bookings         │
│ Verify owner and expiry    │
│ Verify all reserved seats  │
│ Mark every seat as booked  │
└────────┬───────────────────┘
         │
         ▼
  Booking confirmed
```

---

## Double-Booking Prevention

Double-booking prevention is the most important consistency requirement in the application.

### The Problem

Two authenticated users can select the same available seat before either browser receives an updated seat map. Without an atomic backend guard, both reservation requests could appear valid.

### The Solution

The reservation controller uses a MongoDB transaction and updates only seats whose current status is still `available`.

```js
// backend/src/controllers/reservation.controller.js
// Simplified excerpt

const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    const result = await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: seatNumbers },
        status: "available",
      },
      {
        $set: {
          status: "reserved",
          reservationId,
          reservedUntil: expiresAt,
        },
      },
      { session },
    );

    if (result.modifiedCount !== seatNumbers.length) {
      throw new ApiError(
        409,
        "SEATS_UNAVAILABLE",
        "One or more selected seats are no longer available",
      );
    }

    // Create the reservation within the same transaction.
  });
} finally {
  await session.endSession();
}
```

### Why This Works

- The `status: "available"` condition is enforced by MongoDB at write time.
- A competing request cannot update a seat that was already changed to `reserved`.
- `modifiedCount` must equal the number of requested seats.
- Any mismatch aborts the transaction.
- No partial multi-seat reservation is retained.

---

## Reservation Expiry — Two-Layer Design

The application uses two complementary expiry mechanisms.

### Layer 1 — MongoDB TTL Index

The Reservation model contains an absolute `expiresAt` value.

```js
ReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);
```

MongoDB periodically removes expired reservation documents.

### Layer 2 — Lazy Seat Cleanup

Deleting a Reservation document does not automatically update associated Seat documents. The `releaseExpiredSeats` service therefore restores expired seats to:

```js
{
  status: "available",
  reservationId: null,
  reservedUntil: null,
}
```

Cleanup runs before relevant event, reservation, and booking operations. Booking confirmation also validates `expiresAt` explicitly.

### Why Both Layers Are Required

- TTL removes obsolete reservation documents automatically.
- Lazy cleanup prevents seats from remaining visually stuck in the `reserved` state.
- Explicit booking validation prevents an expired reservation from being confirmed.

---

## Project Structure

```text
sortmyscene-booking-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── event.controller.js
│   │   │   └── reservation.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── Event.js
│   │   │   ├── Reservation.js
│   │   │   ├── Seat.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── event.routes.js
│   │   │   └── reservation.routes.js
│   │   ├── services/
│   │   │   └── releaseExpiredSeats.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   └── asyncHandler.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   └── booking-flow.test.js
│   ├── .env.example
│   ├── package.json
│   └── seed.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── components/
│   │   │   ├── booking/
│   │   │   │   ├── CountdownTimer.jsx
│   │   │   │   └── SeatGrid.jsx
│   │   │   ├── common/
│   │   │   │   └── Navbar.jsx
│   │   │   └── events/
│   │   │       └── EventCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useReservation.js
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   ├── Home.jsx
│   │   │   └── NotFound.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── App.jsx
│   │   ├── index.css
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

### Local URLs

```text
Server:   http://localhost:5000
API base: http://localhost:5000/api
Frontend: http://localhost:5173
```

### Health

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| GET | `/api/health` | No | Return API status and timestamp |

### Authentication

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Create a user account |
| POST | `/api/auth/login` | No | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Bearer token | Return the authenticated user |

Register request:

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "SecurePass123"
}
```

Login request:

```json
{
  "email": "demo@example.com",
  "password": "SecurePass123"
}
```

### Events

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| GET | `/api/events` | No | List events with live seat counts |
| GET | `/api/events/:id` | No | Return one event and its complete seat map |

Event data includes backend-managed metadata such as:

```json
{
  "price": 1500,
  "category": "CLUB NIGHT",
  "tag": "SOLD OUT LAST TIME",
  "theme": "purple",
  "accent": "#8B5CF6"
}
```

### Reservations

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| POST | `/api/reserve` | Bearer token | Reserve multiple seats for ten minutes |

Request:

```json
{
  "eventId": "EVENT_OBJECT_ID",
  "seatNumbers": ["A3", "A4"]
}
```

A successful response returns reservation details including the reservation identifier, selected seat numbers, and `expiresAt`.

Important responses:

| Status | Code | Meaning |
|---:|---|---|
| 201 | Reservation created | Every requested seat was reserved |
| 400 | Invalid request | Invalid identifier or malformed data |
| 401 | Authentication error | Token is missing or invalid |
| 409 | `SEATS_UNAVAILABLE` | At least one requested seat is unavailable |
| 422 | `VALIDATION_ERROR` | Request validation failed |

### Bookings

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| POST | `/api/bookings` | Bearer token | Confirm an active reservation |

Request:

```json
{
  "reservationId": "RESERVATION_OBJECT_ID"
}
```

Important responses:

| Status | Code | Meaning |
|---:|---|---|
| 200 | Booking confirmed | Every reserved seat was marked as booked |
| 400 | Invalid request | Invalid reservation identifier |
| 401 | Authentication error | Token is missing or invalid |
| 403 | Ownership error | Reservation belongs to another user |
| 410 | `RESERVATION_EXPIRED` | Reservation expired or no longer exists |

---

## Local Setup

### Prerequisites

- Node.js 22 or later
- npm
- Git
- MongoDB Atlas account or a MongoDB replica set

> MongoDB transactions require a replica set. MongoDB Atlas provides this by default.

### 1. Clone the Repository

```bash
git clone https://github.com/aryancodes12-bit/sortmyscene-booking-system.git
cd sortmyscene-booking-system
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Copy the example environment file:

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

#### macOS or Linux

```bash
cp .env.example .env
```

Configure `backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/sortmyscene_booking?retryWrites=true&w=majority

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

CLIENT_URLS=http://localhost:5173
```

Never commit the real `.env` file.

### 3. Seed the Database

```bash
npm run seed
```

Expected output:

```text
Seed complete: 3 events and 300 seats created
```

The seed command resets development events, seats, and reservations.

### 4. Start the Backend

```bash
npm run dev
```

Verify:

```text
http://localhost:5000/api/health
```

### 5. Configure the Frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Copy the example environment file:

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

#### macOS or Linux

```bash
cp .env.example .env
```

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite server uses a strict port configuration to prevent automatic port changes from causing CORS mismatches.

---

## Available Commands

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start the backend with Nodemon |
| `npm start` | Start the backend with Node.js |
| `npm run seed` | Reset and seed development data |
| `npm test` | Run backend integration tests |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Testing

### Backend Integration Tests

```bash
cd backend
npm test
```

The tests verify:

1. Two concurrent users cannot reserve the same seat.
2. An expired reservation cannot be booked, and its seat is released.

Expected summary:

```text
tests 2
pass 2
fail 0
```

Handled `409 SEATS_UNAVAILABLE` and `410 RESERVATION_EXPIRED` errors appear in the test output intentionally. They represent passing negative-path scenarios.

### Frontend Production Build

```bash
cd frontend
npm run build
```

A successful build produces the optimized `frontend/dist` output.

---

## Security

| Measure | Implementation |
|---|---|
| Password storage | Passwords hashed with bcryptjs |
| Authentication | Signed JWT access tokens |
| Route protection | Bearer-token authentication middleware |
| Authentication abuse protection | express-rate-limit |
| Security headers | Helmet |
| Cross-origin access | Configurable `CLIENT_URLS` allowlist |
| Request limits | 10 KB JSON and URL-encoded body limits |
| Authorization | Reservation ownership validation |
| Data consistency | MongoDB transactions and conditional seat updates |
| Secret management | Real `.env` files excluded from Git |
| Server errors | Generic responses for unexpected internal failures |

---

## Design Decisions

### Why MongoDB Transactions?

Seat reservation is a race-condition-sensitive operation. A transaction ensures that either all requested seats are reserved together or none are. The application never keeps a partial multi-seat reservation.

### Why Check `modifiedCount`?

The conditional update only matches seats whose status is still `available`. If fewer documents are modified than requested, at least one seat was taken by a competing request. The transaction is then aborted and the API returns `409`.

### Why Two Expiry Layers?

The TTL index removes expired Reservation documents, but it does not update Seat documents. Lazy cleanup restores expired seats to `available`, eliminating stale reserved states.

### Why Use the Server's `expiresAt`?

A browser-only timer can drift or disagree with the backend. The countdown is derived from the server-generated expiry timestamp, keeping the interface aligned with backend validation.

### Why Context API Instead of Redux?

The global state is limited to authentication and a small amount of booking state. Context API and custom hooks provide sufficient structure without adding unnecessary Redux boilerplate.

---

## Assignment Requirements Checklist

| Requirement | Status | Implementation |
|---|:---:|---|
| `GET /api/events` | ✅ | Lists events with live seat counts |
| `GET /api/events/:id` | ✅ | Returns event details and complete seat map |
| `POST /api/reserve` | ✅ | Transactional ten-minute reservation |
| `POST /api/bookings` | ✅ | Validates ownership, expiry, and reserved seats |
| Prevent double booking | ✅ | Conditional updates, transaction, and `modifiedCount` guard |
| Multiple-seat selection | ✅ | Interactive React seat grid |
| Live seat states | ✅ | Available, selected, reserved, and booked states |
| Reservation countdown | ✅ | Driven by backend `expiresAt` |
| Expiry recovery | ✅ | TTL index plus lazy seat cleanup |
| Authentication | ✅ | JWT registration, login, and protected routes |
| Conflict handling | ✅ | `409 SEATS_UNAVAILABLE` displayed and recovered in UI |
| Responsive design | ✅ | Desktop, tablet, and mobile layouts |
| Component architecture | ✅ | Reusable cards, seat grid, timer, navbar, and pages |
| State management | ✅ | Context API, React hooks, and custom reservation hook |
| API integration | ✅ | Axios client with structured loading and error states |
| Automated tests | ✅ | Concurrency and expiration integration tests |
| Documentation | ✅ | Architecture, API, setup, testing, screenshots, and checklist |

---

## Deployment

| Service | Live URL |
|---|---|
| Frontend | [SeatSync Web App](https://seat-sync-rho.vercel.app) |
| Backend API | [SeatSync API](https://sortmyscene-api-2w7a.onrender.com) |
| Health Check | [API Health](https://sortmyscene-api-2w7a.onrender.com/api/health) |

> The Render free instance may require a short cold-start period after inactivity.

Repository: [github.com/aryancodes12-bit/sortmyscene-booking-system](https://github.com/aryancodes12-bit/sortmyscene-booking-system)

---

## Author

**Aryan Jaiswal**

GitHub: [@aryancodes12-bit](https://github.com/aryancodes12-bit)

_Submitted to SortMyScene · Full Stack Developer Hiring Assignment · June 2026_
