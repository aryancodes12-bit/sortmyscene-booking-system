const Seat = require("../models/Seat");

/**
 * Releases seat locks whose reservation period has expired.
 *
 * MongoDB's TTL index removes Reservation documents, but it does not
 * update related Seat documents. reservedUntil allows those seats
 * to be reclaimed without a cron job.
 */
const releaseExpiredSeats = async ({
    eventId = null,
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