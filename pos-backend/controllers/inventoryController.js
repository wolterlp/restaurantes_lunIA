const createHttpError = require("http-errors");
const Category = require("../models/categoryModel");
const InventoryMovement = require("../models/inventoryMovementModel");

const addMovement = async (req, res, next) => {
  try {
    const { role, _id: userId } = req.user || {};
    if (!["Admin", "Cashier"].includes(role)) {
      return next(createHttpError(403, "Acceso denegado: ¡Solo Admin o Cajero pueden gestionar inventario!"));
    }

    const { categoryId, itemId, type, quantity, unitCost = 0, supplier = "", supplierId = null, note = "" } = req.body;
    if (!categoryId || !itemId || !type || !quantity) {
      return next(createHttpError(400, "Datos incompletos"));
    }

    const cat = await Category.findOne({ _id: categoryId, "items._id": itemId }, { "items.$": 1 });
    if (!cat) return next(createHttpError(404, "¡Categoría o ítem no encontrado!"));
    const item = cat.items[0];

    let inc = 0;
    if (type === "Ingreso") inc = quantity;
    else if (type === "Salida" || type === "Merma") inc = -quantity;
    else if (type === "Ajuste") inc = quantity; // Ajuste puede ser + o -, usar signo desde el frontend si se requiere

    await Category.findOneAndUpdate(
      { _id: categoryId, "items._id": itemId },
      { 
        $inc: { "items.$.stock": inc },
        ...(unitCost > 0 ? { $set: { "items.$.unitCost": unitCost } } : {})
      }
    );

    const movementPayload = {
      categoryId,
      itemId,
      type,
      quantity,
      unitCost,
      totalCost: unitCost * quantity,
      supplier,
      note,
      user: userId
    };
    if (supplierId) movementPayload.supplierId = supplierId;
    const movement = new InventoryMovement(movementPayload);
    await movement.save();

    res.status(201).json({ success: true, message: "Movimiento registrado", data: movement });
  } catch (error) {
    next(error);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const { itemId, categoryId, startDate, endDate, limit = 100 } = req.query;
    const filter = {};
    if (itemId) filter.itemId = itemId;
    if (categoryId) filter.categoryId = categoryId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const movements = await InventoryMovement.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.status(200).json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
};

module.exports = { addMovement, getMovements };
