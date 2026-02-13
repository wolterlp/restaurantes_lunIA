const express = require("express");
const { addTable, getTables, updateTable, deleteTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification")
const licenseGuard = require("../middlewares/licenseMiddleware");
 
router.route("/").post(isVerifiedUser , licenseGuard, addTable);
router.route("/").get(isVerifiedUser , getTables);
router.route("/:id").put(isVerifiedUser , licenseGuard, updateTable).delete(isVerifiedUser, licenseGuard, deleteTable);

module.exports = router;
