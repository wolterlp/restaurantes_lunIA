const express = require("express");
const { addOrder, addOrderItems, getOrders, getOrderById, updateOrder, updateItemStatus, reassignTable, serveAllReadyItems } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");
const licenseGuard = require("../middlewares/licenseMiddleware");

const router = express.Router();

router.route("/").post(isVerifiedUser, licenseGuard, verifyPermission("MANAGE_ORDERS"), addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id/items").put(isVerifiedUser, licenseGuard, addOrderItems);
router.route("/:id").put(isVerifiedUser, licenseGuard, updateOrder);
router.route("/:id/reassign").put(isVerifiedUser, licenseGuard, verifyPermission("MANAGE_ORDERS"), reassignTable);
router.route("/:id/serve-all").put(isVerifiedUser, licenseGuard, serveAllReadyItems);
router.route("/:orderId/items/:itemId").put(isVerifiedUser, licenseGuard, updateItemStatus);

module.exports = router;
