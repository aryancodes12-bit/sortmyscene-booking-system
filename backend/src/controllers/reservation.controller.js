const mongoose = require("mongoose");

const Event = require("../models/Event");
const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");
const {
    RESERVATION_DURATION_MS,
} = require("../models/Reservation");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const releaseExpiredSeats = require(
    "../services/releaseExpiredSeats",
);

const MAX_SEATS_PER_RESERVATION = 6;

const normalizeSeatNumbers = (seatNumbers) => {
    if (!Array.isArray(seatNumbers)) {
        return [];
    }

    return seatNumbers.map((seatNumber) =>
        typeof seatNumber === "string"
            ? seatNumber.trim().toUpperCase()
            : "",
    );
};

const reserveSeats = asyncHandler(async (req, res) => {
    const eventId =
        typeof req.body.eventId === "string"
            ? req.body.eventId.trim()
            : "";

    const seatNumbers = normalizeSeatNumbers(
        req.body.seatNumbers,
    );

    if (!mongoose.isValidObjectId(eventId)) {
        throw new ApiError(
            400,
            "INVALID_EVENT_ID",
            "The supplied event ID is invalid",
        );
    }

    if (seatNumbers.length === 0) {
        throw new ApiError(
            422,
            "SEATS_REQUIRED",
            "Select at least one seat",
        );
    }

    if (seatNumbers.some((seatNumber) => !seatNumber)) {
        throw new ApiError(
            422,
            "INVALID_SEAT_NUMBER",
            "Every seat number must be a non-empty string",
        );
    }

    if (seatNumbers.length > MAX_SEATS_PER_RESERVATION) {
        throw new ApiError(
            422,
            "SEAT_LIMIT_EXCEEDED",
            `A maximum of ${MAX_SEATS_PER_RESERVATION} seats can be reserved at once`,
        );
    }

    const uniqueSeatNumbers = [...new Set(seatNumbers)];

    if (uniqueSeatNumbers.length !== seatNumbers.length) {
        throw new ApiError(
            422,
            "DUPLICATE_SEAT_NUMBERS",
            "Seat numbers cannot contain duplicates",
        );
    }

    const reservationId = new mongoose.Types.ObjectId();
    const expiresAt = new Date(
        Date.now() + RESERVATION_DURATION_MS,
    );

    const session = await mongoose.startSession();

    let reservation;

    try {
        await session.withTransaction(
            async () => {
                const event = await Event.findById(eventId)
                    .select("_id dateTime")
                    .session(session)
                    .lean();

                if (!event) {
                    throw new ApiError(
                        404,
                        "EVENT_NOT_FOUND",
                        "The requested event was not found",
                    );
                }

                if (new Date(event.dateTime) <= new Date()) {
                    throw new ApiError(
                        409,
                        "EVENT_ALREADY_STARTED",
                        "Reservations are closed because this event has already started",
                    );
                }

                // First reclaim any requested seats whose locks expired.
                await releaseExpiredSeats({
                    eventId,
                    seatNumbers: uniqueSeatNumbers,
                    session,
                });

                // Critical atomic update:
                // only currently available seats may be reserved.
                const updateResult = await Seat.updateMany(
                    {
                        eventId,
                        seatNumber: {
                            $in: uniqueSeatNumbers,
                        },
                        status: "available",
                    },
                    {
                        $set: {
                            status: "reserved",
                            reservationId,
                            reservedUntil: expiresAt,
                        },
                    },
                    {
                        session,
                    },
                );

                // All requested seats must be updated.
                // Any partial update is rolled back by the transaction.
                if (
                    updateResult.modifiedCount !==
                    uniqueSeatNumbers.length
                ) {
                    const seatStates = await Seat.find({
                        eventId,
                        seatNumber: {
                            $in: uniqueSeatNumbers,
                        },
                    })
                        .select(
                            "seatNumber status reservationId -_id",
                        )
                        .session(session)
                        .lean();

                    const stateBySeat = new Map(
                        seatStates.map((seat) => [
                            seat.seatNumber,
                            seat,
                        ]),
                    );

                    const unavailableSeats =
                        uniqueSeatNumbers.filter((seatNumber) => {
                            const seat = stateBySeat.get(seatNumber);

                            if (!seat) {
                                return true;
                            }

                            return (
                                seat.reservationId?.toString() !==
                                reservationId.toString()
                            );
                        });

                    throw new ApiError(
                        409,
                        "SEATS_UNAVAILABLE",
                        "One or more selected seats are no longer available",
                        {
                            unavailableSeats,
                        },
                    );
                }

                [reservation] = await Reservation.create(
                    [
                        {
                            _id: reservationId,
                            userId: req.user._id,
                            eventId,
                            seatNumbers: uniqueSeatNumbers,
                            expiresAt,
                        },
                    ],
                    {
                        session,
                    },
                );
            },
            {
                readConcern: {
                    level: "snapshot",
                },
                writeConcern: {
                    w: "majority",
                },
                readPreference: "primary",
            },
        );
    } finally {
        await session.endSession();
    }

    res.status(201).json({
        success: true,
        message: "Seats reserved for 10 minutes",
        data: {
            reservation: {
                id: reservation._id,
                eventId: reservation.eventId,
                seatNumbers: reservation.seatNumbers,
                expiresAt: reservation.expiresAt,
                createdAt: reservation.createdAt,
            },
        },
    });
});

module.exports = {
    reserveSeats,
};