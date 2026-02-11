const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "Mi Restaurante"
    },
    primaryColor: {
        type: String,
        default: "#ecab0f" // Default yellow
    },
    secondaryColor: {
        type: String,
        default: "#1f1f1f" // Default dark
    },
    logo: {
        type: String,
        default: "" // URL to logo
    },
    backgroundImage: {
        type: String,
        default: "" // URL to background image
    },
    // Facturación
    billing: {
        electronicBilling: { type: Boolean, default: false },
        apiKey: { type: String, default: "" },
        endpoint: { type: String, default: "" }
    },
    // Personalización
    customization: {
        ticketFooter: { type: String, default: "Gracias por su compra" },
        paymentMethods: [{ type: String }], // ["Efectivo", "Tarjeta"]
        taxRate: { type: Number, default: 16 },
        currencySymbol: { type: String, default: "$" },
        thousandsSeparator: { type: String, default: "." },
        decimalSeparator: { type: String, default: "," },
        welcomeMessage: { type: String, default: "Brinda tu mejor servicio a los clientes 😀" },
        // Tiempos de espera para semáforo de pedidos (en minutos)
        orderTimeThresholds: {
            green: { type: Number, default: 15 },
            orange: { type: Number, default: 30 },
            red: { type: Number, default: 45 }
        },
        // Horario Laboral (para cortes y reportes)
        businessHours: {
            openTime: { type: String, default: "02:00" }, // Formato HH:mm
            closeTime: { type: String, default: "23:59" } // Formato HH:mm
        },
        // Período de visualización de ganancias
        earningsPeriod: { 
            type: String, 
            default: "shift",
            enum: ["daily", "shift", "weekly", "monthly", "yearly", "all"] 
        }
    },
    // Licenciamiento
    license: {
        key: { type: String, default: "" },
        status: { type: String, enum: ["active", "suspended", "expired", "invalid", "none"], default: "none" },
        expirationDate: { type: Date },
        lastValidation: { type: Date },
        maxOfflineHours: { type: Number, default: 72 }, // Policy from server
        localSignature: { type: String }, // Integrity check
        features: [{ type: String }] // Para futuros flags de features
    },
    // Dispositivos
    devices: {
        printerName: { type: String, default: "" },
        cashDrawerCode: { type: String, default: "" }
    }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);
