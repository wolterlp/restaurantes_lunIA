const express = require("express");
const { getPerformanceStats, getEconomicStats } = require("../controllers/reportController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.use(isVerifiedUser);

// Route for Performance Report
router.get("/performance", verifyPermission("VIEW_REPORTS"), getPerformanceStats);

// Route for Economic Report
router.get("/economic", verifyPermission("VIEW_REPORTS"), getEconomicStats);

module.exports = router;
