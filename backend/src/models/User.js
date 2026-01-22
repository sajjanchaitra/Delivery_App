const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: "User" },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ["customer","vendor","delivery","admin"], default: "customer" },
    address: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isTestUser: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }   // ✅ AUTO createdAt + updatedAt
);
