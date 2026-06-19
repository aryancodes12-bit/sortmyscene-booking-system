const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Event name is required"],
            trim: true,
            minlength: [2, "Event name must contain at least 2 characters"],
            maxlength: [120, "Event name cannot exceed 120 characters"],
        },

        dateTime: {
            type: Date,
            required: [true, "Event date and time are required"],
        },

        venue: {
            type: String,
            required: [true, "Event venue is required"],
            trim: true,
            maxlength: [180, "Venue cannot exceed 180 characters"],
        },
        price: {
            type: Number,
            required: [true, "Event price is required"],
            min: [0, "Event price cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Event price must be an integer",
            },
        },

        category: {
            type: String,
            required: [true, "Event category is required"],
            trim: true,
            uppercase: true,
            maxlength: [40, "Category cannot exceed 40 characters"],
        },

        tag: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [60, "Event tag cannot exceed 60 characters"],
            default: "",
        },

        theme: {
            type: String,
            required: [true, "Event theme is required"],
            enum: {
                values: ["purple", "gold", "pink"],
                message: "Theme must be purple, gold or pink",
            },
        },

        accent: {
            type: String,
            required: [true, "Event accent colour is required"],
            trim: true,
            uppercase: true,
            match: [
                /^#[0-9A-F]{6}$/,
                "Accent must be a valid six-digit hexadecimal colour",
            ],
        },
        totalSeats: {
            type: Number,
            required: [true, "Total seats are required"],
            min: [1, "An event must have at least one seat"],
            validate: {
                validator: Number.isInteger,
                message: "Total seats must be an integer",
            },
        },

        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
            default: "",
        },

        imageUrl: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

EventSchema.index({ dateTime: 1 });

module.exports = mongoose.model("Event", EventSchema);