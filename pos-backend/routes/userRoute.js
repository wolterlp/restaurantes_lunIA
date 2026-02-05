const express = require("express");
const { register, login, getUserData, logout, getAllUsers, deleteUser, updateUser } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyRole = require("../middlewares/roleMiddleware");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout)

router.route("/").get(isVerifiedUser , getUserData);

// Admin User Management Routes
router.route("/all").get(isVerifiedUser, verifyRole("Admin"), getAllUsers);
router.route("/:id").delete(isVerifiedUser, verifyRole("Admin"), deleteUser);
router.route("/:id").put(isVerifiedUser, verifyRole("Admin"), updateUser);

module.exports = router;