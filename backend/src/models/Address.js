const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, default: "" }, // Home / Office
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },

    houseNo: { type: String, default: "" },
    area: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
