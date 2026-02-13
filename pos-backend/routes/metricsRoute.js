const express = require("express");
const { getDashboardMetrics, getCashCutMetrics, getPopularDishes } = require("../controllers/metricsController");
const licenseGuard = require("../middlewares/licenseMiddleware");
const router = express.Router();

router.use(licenseGuard);
router.get("/", getDashboardMetrics);
router.get("/cash-cut", getCashCutMetrics);
router.get("/popular", getPopularDishes);

module.exports = router;
