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