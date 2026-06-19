const express = require("express");

const {
    reserveSeats,
} = require("../controllers/reservation.controller");

const authenticate = require(
    "../middleware/auth.middleware",
);

const router = express.Router();

router.post("/", authenticate, reserveSeats);

module.exports = router;