const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["Ingreso", "Salida", "Ajuste", "Merma"], required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  supplier: { type: String },
  note: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);
