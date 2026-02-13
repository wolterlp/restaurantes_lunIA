const express = require("express");
const { addCategory, addDish, getAllCategories, updateCategory, deleteCategory, updateDish, deleteDish } = require("../controllers/categoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyPermission = require("../middlewares/permissionMiddleware");
const licenseGuard = require("../middlewares/licenseMiddleware");

const router = express.Router();

router.use(isVerifiedUser);
router.use(licenseGuard);

router.post("/add-category", verifyPermission("MANAGE_MENU"), addCategory);
router.put("/update-category/:id", verifyPermission("MANAGE_MENU"), updateCategory);
router.delete("/delete-category/:id", verifyPermission("MANAGE_MENU"), deleteCategory);

router.post("/add-dish", verifyPermission("MANAGE_MENU"), addDish);
router.put("/update-dish", verifyPermission("MANAGE_MENU"), updateDish);
router.post("/delete-dish", verifyPermission("MANAGE_MENU"), deleteDish); // Using POST for delete dish because we need body

router.get("/get-all", getAllCategories);

module.exports = router;
