const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");
const { addSupplier, getSuppliers, updateSupplier, deleteSupplier, mustBeAdmin } = require("../controllers/supplierController");

const router = express.Router();
router.use(isVerifiedUser);

router.get("/", getSuppliers);
router.post("/", verifyPermission("MANAGE_SUPPLIERS"), addSupplier);
router.put("/:id", verifyPermission("MANAGE_SUPPLIERS"), updateSupplier);
router.delete("/:id", verifyPermission("MANAGE_SUPPLIERS"), deleteSupplier);

module.exports = router;
