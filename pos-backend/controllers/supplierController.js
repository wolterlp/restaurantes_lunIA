const createHttpError = require("http-errors");
const Supplier = require("../models/supplierModel");

const mustBeAdmin = (req, res, next) => {
  const { role } = req.user || {};
  if (role !== "Admin") return next(createHttpError(403, "Acceso denegado"));
  next();
};

const addSupplier = async (req, res, next) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ message: "Proveedor creado", data: supplier });
  } catch (error) {
    next(error);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({ data: suppliers });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
    if (!supplier) return next(createHttpError(404, "Proveedor no encontrado"));
    res.status(200).json({ message: "Proveedor actualizado", data: supplier });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) return next(createHttpError(404, "Proveedor no encontrado"));
    res.status(200).json({ message: "Proveedor eliminado" });
  } catch (error) {
    next(error);
  }
};

module.exports = { addSupplier, getSuppliers, updateSupplier, deleteSupplier, mustBeAdmin };
