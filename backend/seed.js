require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("./src/config/db");
const Event = require("./src/models/Event");
const Seat = require("./src/models/Seat");
const Reservation = require("./src/models/Reservation");

const ROWS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
];

const SEATS_PER_ROW = 10;

const createFutureDate = (daysFromNow, hour, minute = 0) => {
    const date = new Date();

    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);

    return date;
};

const createSeats = (eventId, bookedSeatNumbers = []) => {
    const bookedSeats = new Set(bookedSeatNumbers);

    return ROWS.flatMap((row) =>
        Array.from(
            {
                length: SEATS_PER_ROW,
            },
            (_, index) => {
                const seatNumber = `${row}${index + 1}`;
                const isBooked = bookedSeats.has(seatNumber);

                return {
                    eventId,
                    seatNumber,
                    status: isBooked ? "booked" : "available",
                    reservationId: null,
                    reservedUntil: null,
                };
            },
        ),
    );
};

const seedDatabase = async () => {
    await connectDB();
    await Promise.all([
        Event.syncIndexes(),
        Seat.syncIndexes(),
        Reservation.syncIndexes(),
    ]);
    await Reservation.deleteMany({});
    await Seat.deleteMany({});
    await Event.deleteMany({});
    const events = await Event.insertMany([
        {
            name: "Mumbai Neon Nights",
            dateTime: createFutureDate(7, 20),
            venue: "Lower Parel, Mumbai",
            price: 1500,
            category: "CLUB NIGHT",
            tag: "SOLD OUT LAST TIME",
            theme: "purple",
            accent: "#8B5CF6",
            totalSeats: 100,
            description:
                "An immersive nightlife experience featuring electronic music, neon visuals and Mumbai's leading club artists.",
            imageUrl: "",
        },

        {
            name: "Bollywood After Dark",
            dateTime: createFutureDate(12, 21),
            venue: "Bandra West, Mumbai",
            price: 2000,
            category: "ROOFTOP",
            tag: "FEATURED",
            theme: "gold",
            accent: "#F59E0B",
            totalSeats: 100,
            description:
                "A high-energy Bollywood night featuring popular dance anthems, live performers and premium nightlife production.",
            imageUrl: "",
        },

        {
            name: "Rooftop Rhythm",
            dateTime: createFutureDate(18, 19, 30),
            venue: "Worli, Mumbai",
            price: 999,
            category: "LIVE MUSIC",
            tag: "NEW",
            theme: "pink",
            accent: "#EC4899",
            totalSeats: 100,
            description:
                "A sunset-to-midnight rooftop event with house music, city views and a curated Mumbai nightlife crowd.",
            imageUrl: "",
        },
    ]);

    const seatDocuments = [
        ...createSeats(events[0]._id, [
            "A1",
            "A2",
            "B4",
            "C7",
            "D3",
        ]),

        ...createSeats(events[1]._id, [
            "A5",
            "B1",
            "B2",
            "E8",
            "F4",
            "J10",
        ]),

        ...createSeats(events[2]._id, [
            "C1",
            "C2",
            "C3",
            "G7",
        ]),
    ];

    await Seat.insertMany(seatDocuments);

    console.log(
        `Seed complete: ${events.length} events and ${seatDocuments.length} seats created`,
    );
};

seedDatabase()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });