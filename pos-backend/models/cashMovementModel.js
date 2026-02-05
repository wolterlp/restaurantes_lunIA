const mongoose = require("mongoose");

const cashMovementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Entry", "Exit"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("CashMovement", cashMovementSchema);
