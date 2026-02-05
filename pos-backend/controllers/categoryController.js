const Category = require("../models/categoryModel");

const addCategory = async (req, res) => {
  try {
    const { name, bgColor, icon } = req.body;
    const newCategory = new Category({ name, bgColor, icon });
    await newCategory.save();
    res.status(201).json({ message: "Category added successfully", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addDish = async (req, res) => {
  try {
    const { categoryId, name, price } = req.body;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.items.push({ name, price });
    await category.save();
    res.status(200).json({ message: "Dish added successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bgColor, icon } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, bgColor, icon },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category updated successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDish = async (req, res) => {
  try {
    const { categoryId, dishId, name, price, stock } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, "items._id": dishId },
      {
        $set: {
          "items.$.name": name,
          "items.$.price": price,
          "items.$.stock": stock,
        },
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category or Dish not found" });
    }
    res.status(200).json({ message: "Dish updated successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDish = async (req, res) => {
  try {
    const { categoryId, dishId } = req.body;
    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        $pull: { items: { _id: dishId } },
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Dish deleted successfully", data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addCategory, addDish, getAllCategories, updateCategory, deleteCategory, updateDish, deleteDish };
