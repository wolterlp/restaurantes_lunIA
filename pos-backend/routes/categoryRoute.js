const express = require("express");
const { addCategory, addDish, getAllCategories, updateCategory, deleteCategory, updateDish, deleteDish } = require("../controllers/categoryController");
const router = express.Router();

router.post("/add-category", addCategory);
router.put("/update-category/:id", updateCategory);
router.delete("/delete-category/:id", deleteCategory);

router.post("/add-dish", addDish);
router.put("/update-dish", updateDish);
router.post("/delete-dish", deleteDish); // Using POST for delete dish because we need body

router.get("/get-all", getAllCategories);

module.exports = router;
