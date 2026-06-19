const mongoose = require("mongoose");

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

const ReservationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: [true, "Event ID is required"],
            index: true,
        },

        seatNumbers: {
            type: [String],
            required: [true, "At least one seat number is required"],
            default: undefined,
            validate: {
                validator(seatNumbers) {
                    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
                        return false;
                    }

                    return new Set(seatNumbers).size === seatNumbers.length;
                },
                message:
                    "Seat numbers must contain at least one seat and cannot contain duplicates",
            },
        },

        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + RESERVATION_DURATION_MS),
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// MongoDB automatically removes the document after expiresAt.
ReservationSchema.index(
    {
        expiresAt: 1,
    },
    {
        expireAfterSeconds: 0,
    },
);

ReservationSchema.index({
    userId: 1,
    eventId: 1,
});

module.exports = mongoose.model("Reservation", ReservationSchema);
module.exports.RESERVATION_DURATION_MS = RESERVATION_DURATION_MS;