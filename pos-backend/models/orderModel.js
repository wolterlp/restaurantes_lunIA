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
    orderType: {
        type: String,
        enum: ["Dine-In", "Delivery", "Takeaway"],
        default: "Dine-In"
    },
    deliveryAddress: { type: String },
    deliveryPerson: { type: String }, // Can be a string or a ref to a user
    orderDate: {
        type: Date,
        default : Date.now
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true },
        tip: { type: Number, default: 0 }, // Propina
        discount: { type: Number, default: 0 } // Descuento
    },
    items: [{
        dishId: { type: mongoose.Schema.Types.ObjectId }, 
        name: { type: String, required: true },
        pricePerQuantity: { type: Number, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Total price for this item line (pricePerQuantity * quantity)
        requiresPreparation: { type: Boolean, default: true },
        status: { 
            type: String, 
            enum: ["Pending", "In Progress", "Ready", "Served"], 
            default: "Pending" 
        },
        createdAt: { type: Date, default: Date.now },
        startedAt: { type: Date },
        readyAt: { type: Date },
        servedAt: { type: Date }
    }],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added to track who finalized the order
    cancellationReason: { type: String }, // Motivo de anulación
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Usuario que autorizó la anulación
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
