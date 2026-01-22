const Category = require("../models/Category");

const categories = [
  { name: "Grocery", image: "/uploads/categories/grocery.jpg" },
  { name: "Vegetables", image: "/uploads/categories/vegetables.jpg" },
  { name: "Fruits", image: "/uploads/categories/fruits.jpg" },
  { name: "Dairy", image: "/uploads/categories/dairy.jpg" },
  { name: "Bakery", image: "/uploads/categories/bakery.jpg" },
  { name: "Meat", image: "/uploads/categories/meat.jpg" },
  { name: "Pharmacy", image: "/uploads/categories/pharmacy.jpg" },
  { name: "Restaurant", image: "/uploads/categories/restaurant.jpg" },
];

async function seedCategories() {
  try {
    console.log("🌱 Seeding categories...");

    for (const cat of categories) {
      await Category.updateOne(
        { name: cat.name },
        { $set: { image: cat.image, isActive: true } },
        { upsert: true }
      );
    }

    console.log("✅ Categories inserted/updated successfully");
  } catch (err) {
    console.log("❌ Seed error:", err.message);
  }
}

module.exports = seedCategories;
