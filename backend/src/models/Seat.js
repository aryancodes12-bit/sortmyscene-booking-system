const mongoose = require("mongoose");

const SEAT_STATUSES = ["available", "reserved", "booked"];

const SeatSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: [true, "Event ID is required"],
            index: true,
        },

        seatNumber: {
            type: String,
            required: [true, "Seat number is required"],
            trim: true,
            uppercase: true,
            maxlength: [10, "Seat number cannot exceed 10 characters"],
        },

        status: {
            type: String,
            enum: {
                values: SEAT_STATUSES,
                message: "Invalid seat status: {VALUE}",
            },
            default: "available",
            required: true,
        },

        reservationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            default: null,
        },

        reservedUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// A seat number can exist only once inside the same event.
SeatSchema.index(
    {
        eventId: 1,
        seatNumber: 1,
    },
    {
        unique: true,
    },
);

// Supports event seat queries and efficient expiry cleanup.
SeatSchema.index({
    eventId: 1,
    status: 1,
    reservedUntil: 1,
});

module.exports = mongoose.model("Seat", SeatSchema);
module.exports.SEAT_STATUSES = SEAT_STATUSES;