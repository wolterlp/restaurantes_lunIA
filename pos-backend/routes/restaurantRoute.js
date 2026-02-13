const express = require("express");
const { getConfig, updateConfig, activateLicense } = require("../controllers/restaurantController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");

const router = express.Router();

// Public route to get config (for login screen etc)
router.get("/config", getConfig);

// Activar licencia: protegido para Admin
router.post("/license/activate", isVerifiedUser, verifyPermission("MANAGE_SETTINGS"), activateLicense);

// Protected route to update config (Admin only)
router.put("/config", isVerifiedUser, verifyPermission("MANAGE_SETTINGS"), updateConfig);

module.exports = router;
