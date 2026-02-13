const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  prepTime: { type: Number, default: 15 }, // Estimated preparation time in minutes
  image: { type: String }, // URL or path to image
  sku: { type: String },
  barcode: { type: String },
  unitCost: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 0 }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  bgColor: { type: String, required: true },
  icon: { type: String, required: true },
  items: [itemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
