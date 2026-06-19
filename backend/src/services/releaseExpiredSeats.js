const Seat = require("../models/Seat");

/**
 * Releases expired seat locks.
 *
 * The Reservation TTL index deletes expired reservation documents,
 * but MongoDB does not automatically update related Seat documents.
 * reservedUntil allows stale seat locks to be reclaimed atomically.
 */
const releaseExpiredSeats = async ({
    eventId = null,
    seatNumbers = null,
    session = null,
} = {}) => {
    const filter = {
        status: "reserved",
        reservedUntil: {
            $lte: new Date(),
        },
    };

    if (eventId) {
        filter.eventId = eventId;
    }

    if (Array.isArray(seatNumbers) && seatNumbers.length > 0) {
        filter.seatNumber = {
            $in: seatNumbers,
        };
    }

    const options = session ? { session } : {};

    return Seat.updateMany(
        filter,
        {
            $set: {
                status: "available",
                reservationId: null,
                reservedUntil: null,
            },
        },
        options,
    );
};

module.exports = releaseExpiredSeats;