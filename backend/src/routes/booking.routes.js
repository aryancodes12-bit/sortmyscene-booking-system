const express = require("express");

const {
    confirmBooking,
} = require("../controllers/booking.controller");

const authenticate = require(
    "../middleware/auth.middleware",
);

const router = express.Router();

router.post("/", authenticate, confirmBooking);

module.exports = router;