const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");
const { addMovement, getMovements } = require("../controllers/inventoryController");
const licenseGuard = require("../middlewares/licenseMiddleware");

const router = express.Router();
router.use(isVerifiedUser);
router.use(licenseGuard);

router.post("/movement", verifyPermission("MANAGE_INVENTORY"), addMovement);
router.get("/movement", verifyPermission("MANAGE_INVENTORY"), getMovements);

module.exports = router;
