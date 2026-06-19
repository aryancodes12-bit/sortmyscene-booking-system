const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SortMyScene API is operational",
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: "ROUTE_NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} was not found`,
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || "INTERNAL_SERVER_ERROR",
        message:
            error.statusCode && error.message
                ? error.message
                : "An unexpected server error occurred",
    });
});

module.exports = app;