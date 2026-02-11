const express = require("express");
const { register, login, getUserData, logout, getAllUsers, deleteUser, updateUser, verifyAdmin } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyRole = require("../middlewares/roleMiddleware");
const verifyPermission = require("../middlewares/permissionMiddleware");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/verify-admin").post(verifyAdmin);
router.route("/logout").post(isVerifiedUser, logout)

router.route("/").get(isVerifiedUser , getUserData);

// Admin User Management Routes
// Replaced verifyRole("Admin") with verifyPermission("MANAGE_USERS")
router.route("/all").get(isVerifiedUser, verifyPermission("MANAGE_USERS"), getAllUsers);
router.route("/:id").delete(isVerifiedUser, verifyPermission("MANAGE_USERS"), deleteUser);
router.route("/:id").put(isVerifiedUser, verifyPermission("MANAGE_USERS"), updateUser);

module.exports = router;