const createHttpError = require('http-errors');
const Restaurant = require('../models/restaurantModel');
const { checkLicenseStatus } = require('../services/localLicenseService');

const allowedRolesGuard = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'Cashier') {
      return next();
    }
    
    let status = 'inactive';
    try {
      const res = await checkLicenseStatus();
      status = res.status || (res.valid ? 'active' : 'inactive');
    } catch {
      status = 'inactive';
    }

    const config = await Restaurant.findOne();
    const licensedRoles = config && config.license && Array.isArray(config.license.allowedRoles) && config.license.allowedRoles.length
      ? config.license.allowedRoles
      : ['Admin','Cashier'];
    
    let roles = [];
    if (status === 'active') {
      roles = licensedRoles;
    } else if (status === 'pending_payment') {
      roles = ['Admin','Cashier'];
    } else if (status === 'inactive' || status === 'none') {
      roles = []; // nadie ingresa
    } else {
      roles = ['Admin','Cashier']; // fallback
    }
    const userRole = req.user && req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      // Revalidación inmediata al primer rechazo
      try {
        const res2 = await checkLicenseStatus();
        status = res2.status || (res2.valid ? 'active' : 'inactive');
      } catch {
        status = 'inactive';
      }
      const cfg2 = await Restaurant.findOne();
      const licensed2 = cfg2 && cfg2.license && Array.isArray(cfg2.license.allowedRoles) && cfg2.license.allowedRoles.length
        ? cfg2.license.allowedRoles
        : ['Admin','Cashier'];
      let roles2 = [];
      if (status === 'active') {
        roles2 = licensed2;
      } else if (status === 'pending_payment') {
        roles2 = ['Admin','Cashier'];
      } else if (status === 'inactive' || status === 'none') {
        roles2 = [];
      } else {
        roles2 = ['Admin','Cashier'];
      }
      if (!roles2.includes(userRole)) {
        return next(createHttpError(403, 'Perfil no habilitado por la licencia'));
      }
    }
    next();
  } catch (err) {
    next(createHttpError(500, 'Error verificando perfiles de licencia'));
  }
};

module.exports = allowedRolesGuard
