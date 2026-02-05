const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String }, // URL or path to image
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  bgColor: { type: String, required: true },
  icon: { type: String, required: true },
  items: [itemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
