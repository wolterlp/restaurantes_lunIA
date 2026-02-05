const express = require("express");
const { getConfig, updateConfig } = require("../controllers/restaurantController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyRole = require("../middlewares/roleMiddleware");

const router = express.Router();

// Public route to get config (for login screen etc)
router.get("/config", getConfig);

// Protected route to update config (Admin only)
router.put("/config", isVerifiedUser, verifyRole("Admin"), updateConfig);

module.exports = router;
