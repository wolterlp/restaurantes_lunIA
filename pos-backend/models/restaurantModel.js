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
        taxRate: { type: Number, default: 0 },
        currencySymbol: { type: String, default: "$" },
        welcomeMessage: { type: String, default: "Brinda tu mejor servicio a los clientes 😀" }
    },
    // Dispositivos
    devices: {
        printerName: { type: String, default: "" },
        cashDrawerCode: { type: String, default: "" }
    }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);
