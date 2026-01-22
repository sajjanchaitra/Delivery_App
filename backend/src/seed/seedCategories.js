const Category = require("../models/Category");

const defaultCategories = [
  { name: "Vegetables", image: "", isActive: true },
  { name: "Fruits", image: "", isActive: true },
  { name: "Dairy", image: "", isActive: true },
  { name: "Bakery", image: "", isActive: true },
  { name: "Beverages", image: "", isActive: true },
  { name: "Snacks", image: "", isActive: true },
  { name: "Meat", image: "", isActive: true },
  { name: "Seafood", image: "", isActive: true },
];

async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) {
    console.log("✅ Categories already exist, skipping seed");
    return;
  }

  await Category.insertMany(defaultCategories);
  console.log("✅ Default categories inserted");
}

module.exports = seedCategories;
