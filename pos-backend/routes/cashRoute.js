const express = require("express");
const router = express.Router();
const { 
    addCashMovement, 
    getCashMovements, 
    getCashierCutPreview, 
    getDailyCutPreview,
    createCashCut,
    getCashCuts
} = require("../controllers/cashController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyRole = require("../middlewares/roleMiddleware");

// All routes require auth
router.use(isVerifiedUser);

// Movements
router.post("/movement", addCashMovement);
router.get("/movement", getCashMovements);

// Cuts Preview
router.get("/cut/cashier-preview/:cashierId", getCashierCutPreview);
router.get("/cut/daily-preview", getDailyCutPreview);

// Perform Cut
router.post("/cut", createCashCut);

// History
router.get("/cut", getCashCuts);

module.exports = router;
