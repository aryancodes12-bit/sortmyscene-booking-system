const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is missing from environment variables");
    }

    return jwt.sign(
        {},
        secret,
        {
            subject: userId.toString(),
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        },
    );
};

module.exports = generateToken;