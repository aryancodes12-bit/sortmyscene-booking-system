const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const reservationRoutes = require(
    "./routes/reservation.routes",
);
const bookingRoutes = require(
    "./routes/booking.routes",
);
const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SortMyScene booking API",
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SortMyScene API is operational",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reserve", reservationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: "ROUTE_NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} was not found`,
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            code: "DUPLICATE_RESOURCE",
            message: "A resource with this value already exists",
        });
    }

    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)
            .map((validationError) => validationError.message)
            .join(", ");

        return res.status(422).json({
            success: false,
            code: "VALIDATION_ERROR",
            message,
        });
    }

    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            code: "INVALID_IDENTIFIER",
            message: "The supplied identifier is invalid",
        });
    }

    const statusCode = error.statusCode || 500;

    const response = {
        success: false,
        code: error.code || "INTERNAL_SERVER_ERROR",
        message:
            statusCode < 500 && error.message
                ? error.message
                : "An unexpected server error occurred",
    };

    if (statusCode < 500 && error.details) {
        response.details = error.details;
    }

    res.status(statusCode).json(response);
});

module.exports = app;