const mongoose = require("mongoose");

const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const createBookingReference = (reservationId) => {
    const suffix = reservationId
        .toString()
        .slice(-8)
        .toUpperCase();

    return `SMS-${suffix}`;
};

const confirmBooking = asyncHandler(async (req, res) => {
    const reservationId =
        typeof req.body.reservationId === "string"
            ? req.body.reservationId.trim()
            : "";

    if (!mongoose.isValidObjectId(reservationId)) {
        throw new ApiError(
            400,
            "INVALID_RESERVATION_ID",
            "The supplied reservation ID is invalid",
        );
    }

    const session = await mongoose.startSession();

    let outcome = null;

    try {
        await session.withTransaction(
            async () => {
                const reservation = await Reservation.findById(
                    reservationId,
                ).session(session);

                /*
                 * The TTL monitor may already have deleted an expired
                 * reservation, so a missing reservation is treated as
                 * expired or no longer valid.
                 */
                if (!reservation) {
                    outcome = {
                        type: "expired",
                    };

                    return;
                }

                if (
                    reservation.userId.toString() !==
                    req.user._id.toString()
                ) {
                    throw new ApiError(
                        403,
                        "RESERVATION_FORBIDDEN",
                        "This reservation belongs to another user",
                    );
                }

                const now = new Date();

                if (reservation.expiresAt <= now) {
                    /*
                     * Release only seats locked by this reservation.
                     * This cleanup and reservation deletion are committed
                     * together.
                     */
                    await Seat.updateMany(
                        {
                            eventId: reservation.eventId,
                            seatNumber: {
                                $in: reservation.seatNumbers,
                            },
                            status: "reserved",
                            reservationId: reservation._id,
                        },
                        {
                            $set: {
                                status: "available",
                                reservationId: null,
                                reservedUntil: null,
                            },
                        },
                        {
                            session,
                        },
                    );

                    await Reservation.deleteOne(
                        {
                            _id: reservation._id,
                        },
                        {
                            session,
                        },
                    );

                    outcome = {
                        type: "expired",
                    };

                    return;
                }

                /*
                 * Critical ownership/state filter:
                 * seats must still be reserved by this exact reservation
                 * and their lock must still be active.
                 */
                const updateResult = await Seat.updateMany(
                    {
                        eventId: reservation.eventId,
                        seatNumber: {
                            $in: reservation.seatNumbers,
                        },
                        status: "reserved",
                        reservationId: reservation._id,
                        reservedUntil: {
                            $gt: now,
                        },
                    },
                    {
                        $set: {
                            status: "booked",
                            reservationId: null,
                            reservedUntil: null,
                        },
                    },
                    {
                        session,
                    },
                );

                if (
                    updateResult.modifiedCount !==
                    reservation.seatNumbers.length
                ) {
                    throw new ApiError(
                        409,
                        "RESERVATION_INVALID",
                        "The reservation seats are no longer valid",
                    );
                }

                await Reservation.deleteOne(
                    {
                        _id: reservation._id,
                    },
                    {
                        session,
                    },
                );

                outcome = {
                    type: "confirmed",
                    booking: {
                        reference: createBookingReference(
                            reservation._id,
                        ),
                        reservationId: reservation._id,
                        eventId: reservation.eventId,
                        seatNumbers: reservation.seatNumbers,
                        bookedAt: now,
                    },
                };
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

    if (!outcome || outcome.type === "expired") {
        throw new ApiError(
            410,
            "RESERVATION_EXPIRED",
            "The reservation was not found or has expired",
        );
    }

    res.status(200).json({
        success: true,
        message: "Booking confirmed successfully",
        data: {
            booking: outcome.booking,
        },
    });
});

module.exports = {
    confirmBooking,
};