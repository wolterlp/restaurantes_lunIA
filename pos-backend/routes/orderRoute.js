const express = require("express");
const { addOrder, addOrderItems, getOrders, getOrderById, updateOrder, updateItemStatus, reassignTable, serveAllReadyItems } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");
const licenseGuard = require("../middlewares/licenseMiddleware");
const allowedRolesGuard = require("../middlewares/allowedRolesGuard");

const router = express.Router();

router.route("/").post(isVerifiedUser, allowedRolesGuard, licenseGuard, verifyPermission("MANAGE_ORDERS"), addOrder);
router.route("/").get(isVerifiedUser, allowedRolesGuard, getOrders);
router.route("/:id").get(isVerifiedUser, allowedRolesGuard, getOrderById);
router.route("/:id/items").put(isVerifiedUser, allowedRolesGuard, licenseGuard, addOrderItems);
router.route("/:id").put(isVerifiedUser, allowedRolesGuard, licenseGuard, updateOrder);
router.route("/:id/reassign").put(isVerifiedUser, allowedRolesGuard, licenseGuard, verifyPermission("MANAGE_ORDERS"), reassignTable);
router.route("/:id/serve-all").put(isVerifiedUser, allowedRolesGuard, licenseGuard, serveAllReadyItems);
router.route("/:orderId/items/:itemId").put(isVerifiedUser, allowedRolesGuard, licenseGuard, updateItemStatus);

module.exports = router;
