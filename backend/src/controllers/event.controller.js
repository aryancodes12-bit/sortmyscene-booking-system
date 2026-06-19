const mongoose = require("mongoose");

const Event = require("../models/Event");
const Seat = require("../models/Seat");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const releaseExpiredSeats = require("../services/releaseExpiredSeats");

const serializeEvent = (event) => {
    const {
        _id,
        __v,
        ...eventData
    } = event;

    return {
        id: _id,
        ...eventData,
    };
};

const getEvents = asyncHandler(async (req, res) => {
    await releaseExpiredSeats();

    const events = await Event.aggregate([
        {
            $lookup: {
                from: Seat.collection.name,
                let: {
                    currentEventId: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$eventId", "$$currentEventId"],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,

                            availableSeatCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$status", "available"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            reservedSeatCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$status", "reserved"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            bookedSeatCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: ["$status", "booked"],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ],
                as: "seatSummary",
            },
        },

        {
            $addFields: {
                availableSeatCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$seatSummary.availableSeatCount",
                                0,
                            ],
                        },
                        0,
                    ],
                },

                reservedSeatCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$seatSummary.reservedSeatCount",
                                0,
                            ],
                        },
                        0,
                    ],
                },

                bookedSeatCount: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$seatSummary.bookedSeatCount",
                                0,
                            ],
                        },
                        0,
                    ],
                },
            },
        },

        {
            $project: {
                seatSummary: 0,
                __v: 0,
            },
        },

        {
            $sort: {
                dateTime: 1,
            },
        },
    ]);

    res.status(200).json({
        success: true,
        data: {
            events: events.map(serializeEvent),
        },
    });
});

const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(
            400,
            "INVALID_EVENT_ID",
            "The supplied event ID is invalid",
        );
    }

    await releaseExpiredSeats({
        eventId: id,
    });

    const [event, seats] = await Promise.all([
        Event.findById(id).lean(),

        Seat.find({
            eventId: id,
        })
            .select("seatNumber status -_id")
            .lean(),
    ]);

    if (!event) {
        throw new ApiError(
            404,
            "EVENT_NOT_FOUND",
            "The requested event was not found",
        );
    }

    seats.sort((firstSeat, secondSeat) =>
        firstSeat.seatNumber.localeCompare(
            secondSeat.seatNumber,
            undefined,
            {
                numeric: true,
                sensitivity: "base",
            },
        ),
    );

    const seatCounts = seats.reduce(
        (counts, seat) => {
            counts[seat.status] += 1;
            return counts;
        },
        {
            available: 0,
            reserved: 0,
            booked: 0,
        },
    );

    res.status(200).json({
        success: true,
        data: {
            event: {
                ...serializeEvent(event),
                availableSeatCount: seatCounts.available,
                reservedSeatCount: seatCounts.reserved,
                bookedSeatCount: seatCounts.booked,
            },
            seats,
        },
    });
});

module.exports = {
    getEvents,
    getEventById,
};