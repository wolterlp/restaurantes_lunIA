const express = require("express");
const { addOrder, addOrderItems, getOrders, getOrderById, updateOrder, updateItemStatus, reassignTable, serveAllReadyItems } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");

const router = express.Router();


router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id/items").put(isVerifiedUser, addOrderItems);
router.route("/:id").put(isVerifiedUser, updateOrder);
router.route("/:id/reassign").put(isVerifiedUser, reassignTable);
router.route("/:id/serve-all").put(isVerifiedUser, serveAllReadyItems);
router.route("/:orderId/items/:itemId").put(isVerifiedUser, updateItemStatus);

module.exports = router;