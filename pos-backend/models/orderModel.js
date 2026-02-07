const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String },
        guests: { type: Number },
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ["Pending", "In Progress", "Ready", "Completed", "Out for Delivery", "Delivered", "Cancelled"],
        default: "Pending"
    },
    orderDate: {
        type: Date,
        default : Date.now()
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true },
        tip: { type: Number, default: 0 }, // Propina
    },
    items: [{
        dishId: { type: mongoose.Schema.Types.ObjectId }, 
        name: { type: String, required: true },
        pricePerQuantity: { type: Number, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Total price for this item line (pricePerQuantity * quantity)
        status: { 
            type: String, 
            enum: ["Pending", "In Progress", "Ready", "Served"], 
            default: "Pending" 
        },
        createdAt: { type: Date, default: Date.now }
    }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added to track who finalized the order
    paymentMethod: String,
    paymentDetails: {
        // Cash details
        cashReceived: Number,
        change: Number,
        
        // Transfer details
        transferPlatform: String,
        transferAmount: Number,
        
        // Mixed details handled by combining above fields
        externalTransactionId: String,
        paymentReference: String
    }
}, { timestamps : true } );

module.exports = mongoose.model("Order", orderSchema);