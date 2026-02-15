const express = require("express");
const { getConfig, updateConfig, activateLicense, getLicenseStatus, setLicenseServerSecret } = require("../controllers/restaurantController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");

const router = express.Router();

// Public route to get config (for login screen etc)
router.get("/config", getConfig);
router.get("/license/status", getLicenseStatus);

// Activar licencia:
// - Si la licencia está 'inactive' o no existe, permite acceso público desde Auth/overlay
// - Si está 'active' o 'pending_payment', el controlador exigirá Admin
router.post("/license/activate", activateLicense);

// Actualizar secreto del servidor de licencias:
// - Público si estado es 'inactive'/'none'/'expired'; Admin si 'active'/'pending_payment'
router.post("/license/server-secret", setLicenseServerSecret);

// Protected route to update config (Admin only)
router.put("/config", isVerifiedUser, verifyPermission("MANAGE_SETTINGS"), updateConfig);

module.exports = router;
