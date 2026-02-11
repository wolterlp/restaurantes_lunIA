const express = require("express");
const { getConfig, updateConfig, activateLicense } = require("../controllers/restaurantController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");

const router = express.Router();

// Public route to get config (for login screen etc)
router.get("/config", getConfig);

// Activate license (Public or Protected? Ideally protected, but if locked out, maybe public with key)
// For now, let's make it public to allow activation from lock screen, 
// OR protected if we assume an admin is logged in but features are locked.
// Let's make it public to allow initial setup easily.
router.post("/license/activate", activateLicense);

// Protected route to update config (Admin only)
router.put("/config", isVerifiedUser, verifyPermission("MANAGE_SETTINGS"), updateConfig);

module.exports = router;
