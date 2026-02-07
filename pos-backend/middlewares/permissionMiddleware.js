const createHttpError = require("http-errors");
const Role = require("../models/roleModel");

// verifyPermission("MANAGE_USERS")
const verifyPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(createHttpError(401, "No autenticado"));
      }

      // 1. Fetch the Role document for the current user's role
      // We assume req.user.role contains the role name (e.g., "Admin")
      // Ideally, User model should reference Role ID, but current implementation uses String.
      // So we query Role by name.
      const userRoleName = req.user.role;
      const roleDoc = await Role.findOne({ name: userRoleName });

      if (!roleDoc) {
        return next(createHttpError(403, "Rol no definido en el sistema"));
      }

      // 2. Check if the role has the required permission
      // Admin should usually have everything, but let's stick to explicit permissions
      // OR allow "Admin" role to bypass check?
      // Better to make Admin have all permissions in DB.
      if (!roleDoc.permissions.includes(requiredPermission)) {
        return next(createHttpError(403, `Permiso faltante: ${requiredPermission}`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = verifyPermission;
