const createHttpError = require("http-errors");

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        createHttpError(403, "You are not authorized to access this resource")
      );
    }
    next();
  };
};

module.exports = verifyRole;