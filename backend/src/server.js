require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectMongo = require("./config/db");   // 👈 add this

const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");
const customerRoutes = require("./routes/customer.routes");
const deliveryRoutes = require("./routes/delivery.routes");

const app = express();

connectMongo();  // 👈 connect MongoDB before routes

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/delivery", deliveryRoutes);

app.get("/", (_, res) => res.send("Delivery App API Running"));

app.listen(5000, () => console.log("🚀 Backend running at http://localhost:5000"));
