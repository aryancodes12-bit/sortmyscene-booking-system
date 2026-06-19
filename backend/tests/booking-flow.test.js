process.env.NODE_ENV = "test";

require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Event = require("../src/models/Event");
const Seat = require("../src/models/Seat");
const Reservation = require("../src/models/Reservation");

const uniqueSuffix = `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

const firstUser = {
    name: "Concurrency User A",
    email: `concurrency-a-${uniqueSuffix}@example.com`,
    password: "StrongPass123!",
};

const secondUser = {
    name: "Concurrency User B",
    email: `concurrency-b-${uniqueSuffix}@example.com`,
    password: "StrongPass456!",
};

let event;
let raceSeatNumber;
let expirySeatNumber;
let firstToken;
let secondToken;

const resetSeats = async () => {
    if (!event || !raceSeatNumber || !expirySeatNumber) {
        return;
    }

    await Seat.updateMany(
        {
            eventId: event._id,
            seatNumber: {
                $in: [raceSeatNumber, expirySeatNumber],
            },
        },
        {
            $set: {
                status: "available",
                reservationId: null,
                reservedUntil: null,
            },
        },
    );
};

test.before(async () => {
    await connectDB();

    event = await Event.findOne({
        dateTime: {
            $gt: new Date(),
        },
    });

    assert.ok(
        event,
        "Seed data must contain at least one future event",
    );

    const availableSeats = await Seat.find({
        eventId: event._id,
        status: "available",
    })
        .sort({
            seatNumber: 1,
        })
        .limit(2)
        .lean();

    assert.ok(
        availableSeats.length >= 2,
        "At least two available seats are required",
    );

    raceSeatNumber = availableSeats[0].seatNumber;
    expirySeatNumber = availableSeats[1].seatNumber;

    await resetSeats();

    const firstRegistration = await request(app)
        .post("/api/auth/register")
        .send(firstUser);

    assert.equal(firstRegistration.status, 201);
    firstToken = firstRegistration.body.data.token;

    const secondRegistration = await request(app)
        .post("/api/auth/register")
        .send(secondUser);

    assert.equal(secondRegistration.status, 201);
    secondToken = secondRegistration.body.data.token;
});

test.after(async () => {
    if (event) {
        await Reservation.deleteMany({
            eventId: event._id,
            seatNumbers: {
                $in: [raceSeatNumber, expirySeatNumber],
            },
        });

        await resetSeats();
    }

    await User.deleteMany({
        email: {
            $in: [firstUser.email, secondUser.email],
        },
    });

    await mongoose.connection.close();
});

test(
    "two concurrent users cannot reserve the same seat",
    async () => {
        const requestBody = {
            eventId: event._id.toString(),
            seatNumbers: [raceSeatNumber],
        };

        const [firstResponse, secondResponse] =
            await Promise.all([
                request(app)
                    .post("/api/reserve")
                    .set(
                        "Authorization",
                        `Bearer ${firstToken}`,
                    )
                    .send(requestBody),

                request(app)
                    .post("/api/reserve")
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    )
                    .send(requestBody),
            ]);

        const statuses = [
            firstResponse.status,
            secondResponse.status,
        ].sort((first, second) => first - second);

        assert.deepEqual(
            statuses,
            [201, 409],
            "Exactly one request must succeed and one must conflict",
        );

        const successfulResponse =
            firstResponse.status === 201
                ? firstResponse
                : secondResponse;

        const conflictResponse =
            firstResponse.status === 409
                ? firstResponse
                : secondResponse;

        assert.equal(successfulResponse.body.success, true);

        assert.equal(
            conflictResponse.body.code,
            "SEATS_UNAVAILABLE",
        );

        const seat = await Seat.findOne({
            eventId: event._id,
            seatNumber: raceSeatNumber,
        }).lean();

        assert.equal(seat.status, "reserved");
        assert.ok(seat.reservationId);

        const reservations = await Reservation.find({
            eventId: event._id,
            seatNumbers: raceSeatNumber,
        }).lean();

        assert.equal(
            reservations.length,
            1,
            "Only one reservation document should exist",
        );
    },
);

test(
    "expired reservation cannot be booked and its seat is released",
    async () => {
        const reserveResponse = await request(app)
            .post("/api/reserve")
            .set(
                "Authorization",
                `Bearer ${firstToken}`,
            )
            .send({
                eventId: event._id.toString(),
                seatNumbers: [expirySeatNumber],
            });

        assert.equal(reserveResponse.status, 201);

        const reservationId =
            reserveResponse.body.data.reservation.id;

        const expiredTime = new Date(
            Date.now() - 60 * 1000,
        );

        await Reservation.updateOne(
            {
                _id: reservationId,
            },
            {
                $set: {
                    expiresAt: expiredTime,
                },
            },
        );

        await Seat.updateOne(
            {
                eventId: event._id,
                seatNumber: expirySeatNumber,
            },
            {
                $set: {
                    reservedUntil: expiredTime,
                },
            },
        );

        const bookingResponse = await request(app)
            .post("/api/bookings")
            .set(
                "Authorization",
                `Bearer ${firstToken}`,
            )
            .send({
                reservationId,
            });

        assert.equal(bookingResponse.status, 410);

        assert.equal(
            bookingResponse.body.code,
            "RESERVATION_EXPIRED",
        );

        // This read also performs lazy expired-seat recovery if
        // MongoDB's TTL monitor deleted the reservation first.
        const eventResponse = await request(app).get(
            `/api/events/${event._id}`,
        );

        assert.equal(eventResponse.status, 200);

        const releasedSeat =
            eventResponse.body.data.seats.find(
                (seat) =>
                    seat.seatNumber === expirySeatNumber,
            );

        assert.ok(releasedSeat);

        assert.equal(
            releasedSeat.status,
            "available",
            "Expired seat must become available again",
        );
    },
);