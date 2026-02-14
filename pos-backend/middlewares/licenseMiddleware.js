const Restaurant = require("../models/restaurantModel");
const createHttpError = require("http-errors");

const licenseGuard = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "Cashier") {
      return next();
    }
    const config = await Restaurant.findOne();
    if (!config || !config.license) {
      return next(createHttpError(403, "Licencia no configurada en el servidor"));
    }
    const { status, expirationDate } = config.license;
    const now = new Date();
    const isActive = status === "active" && (!expirationDate || new Date(expirationDate) > now);
    if (!isActive) {
      const expMsg = status === "expired" ? "Licencia expirada" : "Licencia inválida";
      return next(createHttpError(403, expMsg));
    }
    next();
  } catch (err) {
    next(createHttpError(500, "Error verificando la licencia"));
  }
};

module.exports = licenseGuard;
