require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

let server;

const startServer = async () => {
    await connectDB();

    server = app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
    });
};

const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    if (server) {
        server.close(async () => {
            await mongoose.connection.close();
            console.log("HTTP server and MongoDB connection closed");
            process.exit(0);
        });
    } else {
        await mongoose.connection.close();
        process.exit(0);
    }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
});