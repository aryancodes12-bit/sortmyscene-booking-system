const bcrypt = require("bcryptjs");

const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
    const name =
        typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    const password =
        typeof req.body.password === "string"
            ? req.body.password
            : "";

    if (name.length < 2) {
        throw new ApiError(
            422,
            "INVALID_NAME",
            "Name must contain at least 2 characters",
        );
    }

    if (!EMAIL_PATTERN.test(email)) {
        throw new ApiError(
            422,
            "INVALID_EMAIL",
            "Enter a valid email address",
        );
    }

    if (password.length < 8) {
        throw new ApiError(
            422,
            "INVALID_PASSWORD",
            "Password must contain at least 8 characters",
        );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(
            409,
            "EMAIL_ALREADY_REGISTERED",
            "An account with this email already exists",
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        email,
        password: passwordHash,
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
            user: sanitizeUser(user),
            token,
        },
    });
});

const login = asyncHandler(async (req, res) => {
    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    const password =
        typeof req.body.password === "string"
            ? req.body.password
            : "";

    if (!email || !password) {
        throw new ApiError(
            422,
            "MISSING_CREDENTIALS",
            "Email and password are required",
        );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(
            401,
            "INVALID_CREDENTIALS",
            "Email or password is incorrect",
        );
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password,
    );

    if (!passwordMatches) {
        throw new ApiError(
            401,
            "INVALID_CREDENTIALS",
            "Email or password is incorrect",
        );
    }

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user: sanitizeUser(user),
            token,
        },
    });
});

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: sanitizeUser(req.user),
        },
    });
});

module.exports = {
    register,
    login,
    getCurrentUser,
};