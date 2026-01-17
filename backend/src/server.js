const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Load env ONLY ONCE, with correct path
require("dotenv").config({ path: "../.env" });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug (temporary – remove later)
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/stores", require("./routes/stores"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/cart", require("./routes/cart"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "QuickMart API is running! 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
