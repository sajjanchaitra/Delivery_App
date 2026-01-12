require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");
const customerRoutes = require("./routes/customer.routes");
const deliveryRoutes = require("./routes/delivery.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/delivery", deliveryRoutes);

app.get("/", (_, res) => res.send("Delivery App API Running"));

app.listen(5000, () => console.log("🚀 Backend running at http://localhost:5000"));
