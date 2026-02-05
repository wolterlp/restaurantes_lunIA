const mongoose = require("mongoose");

const cashCutSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Cashier", "Daily"],
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Required if type is Cashier
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cutDate: {
        type: Date,
        default: Date.now
    },
    dateRange: {
        start: Date,
        end: Date
    },
    metrics: {
        cashFund: { type: Number, default: 0 },
        cashSales: { type: Number, default: 0 },
        creditCardSales: { type: Number, default: 0 },
        transferSales: { type: Number, default: 0 },
        otherSales: { type: Number, default: 0 },
        creditSales: { type: Number, default: 0 }, // Sales on credit
        voucherSales: { type: Number, default: 0 },
        
        totalEntries: { type: Number, default: 0 },
        totalExits: { type: Number, default: 0 },
        cashRefunds: { type: Number, default: 0 },
        
        calculatedTotalCash: { type: Number, default: 0 }, // Expected cash in drawer
        declaredTotalCash: { type: Number, default: 0 }, // Actual cash counted (optional for now)
        difference: { type: Number, default: 0 },
        
        totalSales: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }
    },
    movementsIncluded: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CashMovement"
    }],
    ordersIncluded: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }]
}, { timestamps: true });

module.exports = mongoose.model("CashCut", cashCutSchema);
