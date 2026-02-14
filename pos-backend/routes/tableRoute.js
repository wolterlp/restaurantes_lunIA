const express = require("express");
const { addTable, getTables, updateTable, deleteTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification")
const licenseGuard = require("../middlewares/licenseMiddleware");
const allowedRolesGuard = require("../middlewares/allowedRolesGuard");
 
router.route("/").post(isVerifiedUser , allowedRolesGuard, licenseGuard, addTable);
router.route("/").get(isVerifiedUser , allowedRolesGuard, getTables);
router.route("/:id").put(isVerifiedUser , allowedRolesGuard, licenseGuard, updateTable).delete(isVerifiedUser, allowedRolesGuard, licenseGuard, deleteTable);

module.exports = router;
