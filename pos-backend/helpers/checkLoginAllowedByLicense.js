const Restaurant = require('../models/restaurantModel');
const { checkLicenseStatus } = require('../services/localLicenseService');

const checkLoginAllowedByLicense = async (userRole) => {
  // Check license status online/offline validity and map allowed roles by status
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
    : ['Admin', 'Cashier'];
  
  let roles = [];
  if (status === 'active') {
    roles = licensedRoles;
  } else if (status === 'pending_payment') {
    roles = ['Admin', 'Cashier'];
  } else if (status === 'inactive' || status === 'none') {
    roles = []; // nadie ingresa
  } else {
    roles = ['Admin', 'Cashier']; // fallback seguro
  }
  if (roles.includes(userRole)) return true;

  // Revalidación inmediata si fue denegado: consultar de nuevo y recalcular
  try {
    const res2 = await checkLicenseStatus();
    status = res2.status || (res2.valid ? 'active' : 'inactive');
  } catch {
    status = 'inactive';
  }

  const cfg2 = await Restaurant.findOne();
  const licensed2 = cfg2 && cfg2.license && Array.isArray(cfg2.license.allowedRoles) && cfg2.license.allowedRoles.length
    ? cfg2.license.allowedRoles
    : ['Admin', 'Cashier'];

  let roles2 = [];
  if (status === 'active') {
    roles2 = licensed2;
  } else if (status === 'pending_payment') {
    roles2 = ['Admin', 'Cashier'];
  } else if (status === 'inactive' || status === 'none') {
    roles2 = [];
  } else {
    roles2 = ['Admin', 'Cashier'];
  }
  return roles2.includes(userRole);
};

module.exports = { checkLoginAllowedByLicense }
