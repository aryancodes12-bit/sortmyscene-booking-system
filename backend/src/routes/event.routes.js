const express = require("express");

const {
    getEvents,
    getEventById,
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEventById);

module.exports = router;