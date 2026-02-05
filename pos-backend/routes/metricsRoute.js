const express = require("express");
const { getDashboardMetrics, getCashCutMetrics, getPopularDishes } = require("../controllers/metricsController");
const router = express.Router();

router.get("/", getDashboardMetrics);
router.get("/cash-cut", getCashCutMetrics);
router.get("/popular", getPopularDishes);

module.exports = router;
