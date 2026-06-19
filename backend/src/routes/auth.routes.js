const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    register,
    login,
    getCurrentUser,
} = require("../controllers/auth.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        code: "TOO_MANY_AUTH_REQUESTS",
        message: "Too many authentication attempts. Please try again later.",
    },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;