const jwt = require("jsonwebtoken");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const authenticate = asyncHandler(async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        throw new ApiError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Authentication is required",
        );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        throw new ApiError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Authentication token is missing",
        );
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(
            401,
            "INVALID_TOKEN",
            "Authentication token is invalid or expired",
        );
    }

    if (!decoded.sub) {
        throw new ApiError(
            401,
            "INVALID_TOKEN",
            "Authentication token is invalid",
        );
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
        throw new ApiError(
            401,
            "USER_NOT_FOUND",
            "The user associated with this token no longer exists",
        );
    }

    req.user = user;
    next();
});

module.exports = authenticate;