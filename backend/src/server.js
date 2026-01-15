const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quickmart";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import Routes
const authRoutes = require("./routes/auth");
const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "QuickMart API is running! 🚀" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});