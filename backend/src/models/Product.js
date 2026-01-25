// backend/src/models/Product.js
// Updated Product Model with Multi-Type Support + storeType + meta + stockQuantity fix

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==================== BASIC INFO ====================
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    brand: { type: String, default: "" },

    // ==================== PRODUCT TYPE ====================
    // (Your old logic uses productType: general / medical / food)
    productType: {
      type: String,
      enum: ["general", "medical", "food"],
      default: "general",
    },

    // ==================== STORE TYPE (NEW) ====================
    // This matches Store.storeType and your frontend logic
    storeType: {
      type: String,
      enum: ["general", "medical", "restaurant"],
      default: "general",
    },

    // ==================== META (NEW) ====================
    // Flexible storeType-based fields coming from frontend
    // Example:
    // restaurant: { isVeg, prepTime, serves }
    // medical: { mrp, expiryDate, prescriptionRequired }
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ==================== IMAGES ====================
    images: [{ type: String }],
    thumbnail: { type: String, default: "" },

    // ==================== PRICING ====================
    price: { type: Number, required: true }, // MRP
    discountPrice: { type: Number }, // Selling price
    salePrice: { type: Number }, // Sale price (temporary)
    costPrice: { type: Number }, // Purchase price (for profit calc)

    // ==================== QUANTITY & STOCK ====================
    quantity: { type: String, default: "1" }, // Display quantity (e.g., "500g", "1L")
    unit: { type: String, default: "pcs" }, // kg, g, L, ml, pcs, strip, etc.
    packSize: { type: String, default: "1" },

    // Main stock field
    stock: { type: Number, default: 0 },

    // IMPORTANT: Frontend is using stockQuantity in UI
    // so keep it for compatibility (optional but recommended)
    stockQuantity: { type: Number, default: 0 },

    minStock: { type: Number, default: 5 }, // Alert threshold
    maxStock: { type: Number, default: 1000 },

    // ==================== IDENTIFIERS ====================
    sku: { type: String, default: "" },
    barcode: { type: String, default: "" },
    hsnCode: { type: String, default: "" },

    // ==================== TAX ====================
    gstRate: { type: Number, default: 0 }, // Percentage

    // ==================== MEDICAL PRODUCT FIELDS ====================
    genericName: { type: String, default: "" }, // Salt composition
    manufacturer: { type: String, default: "" },
    batchNumber: { type: String, default: "" },
    expiryDate: { type: Date },
    manufactureDate: { type: Date },
    prescriptionRequired: { type: Boolean, default: false },
    isControlled: { type: Boolean, default: false }, // Schedule H, H1, X
    drugSchedule: { type: String, default: "" }, // H, H1, X, G
    composition: { type: String, default: "" },
    dosage: { type: String, default: "" },
    sideEffects: { type: String, default: "" },
    storage: { type: String, default: "" }, // Storage instructions

    // ==================== FOOD/RESTAURANT FIELDS ====================
    foodType: {
      type: String,
      enum: ["veg", "nonveg", "egg"],
      default: "veg",
    },
    spiceLevel: {
      type: String,
      enum: ["none", "mild", "medium", "hot", "extra_hot"],
      default: "medium",
    },
    cuisine: { type: String, default: "" },
    preparationTime: { type: Number, default: 20 }, // minutes
    serves: { type: String, default: "1" }, // Serving size
    calories: { type: Number, default: 0 },

    ingredients: [{ type: String }],
    allergens: [{ type: String }], // Nuts, Dairy, Gluten, etc.
    nutritionInfo: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },

    // Add-ons and Variants (for food)
    addons: [
      {
        name: { type: String },
        price: { type: Number },
        isAvailable: { type: Boolean, default: true },
      },
    ],

    variants: [
      {
        name: { type: String }, // e.g., "Small", "Medium", "Large"
        price: { type: Number },
        discountPrice: { type: Number },
        isAvailable: { type: Boolean, default: true },
      },
    ],

    customizations: [
      {
        name: { type: String }, // e.g., "Choose your base"
        required: { type: Boolean, default: false },
        maxSelection: { type: Number, default: 1 },
        options: [
          {
            name: { type: String },
            price: { type: Number, default: 0 },
          },
        ],
      },
    ],

    // ==================== AVAILABILITY ====================
    inStock: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },

    // Availability timing (for restaurants)
    availableFrom: { type: String, default: "00:00" },
    availableTill: { type: String, default: "23:59" },
    availableDays: {
      type: [String],
      default: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },

    // ==================== STATS ====================
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // ==================== SEO & SEARCH ====================
    tags: [{ type: String }],
    searchKeywords: [{ type: String }],

    // ==================== ORDERING ====================
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ==================== INDEXES ====================
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ storeType: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });

// ==================== VIRTUALS ====================
productSchema.virtual("finalPrice").get(function () {
  return this.salePrice || this.discountPrice || this.price;
});

productSchema.virtual("discountPercent").get(function () {
  const final = this.salePrice || this.discountPrice;
  if (!final || final >= this.price) return 0;
  return Math.round(((this.price - final) / this.price) * 100);
});

// ==================== METHODS ====================
productSchema.methods.isAvailableNow = function () {
  if (!this.isActive || !this.isAvailable || !this.inStock) return false;

  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = days[now.getDay()];

  if (!this.availableDays.includes(today)) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [fromHour, fromMin] = this.availableFrom.split(":").map(Number);
  const [tillHour, tillMin] = this.availableTill.split(":").map(Number);

  const fromTime = fromHour * 60 + fromMin;
  const tillTime = tillHour * 60 + tillMin;

  return currentTime >= fromTime && currentTime <= tillTime;
};

productSchema.methods.isExpired = function () {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
};

productSchema.methods.isExpiringSoon = function () {
  if (!this.expiryDate) return false;
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  return new Date(this.expiryDate) <= threeMonthsLater;
};

// ==================== PRE SAVE ====================
productSchema.pre("save", function (next) {
  const safeTags = Array.isArray(this.tags) ? this.tags : [];

  const keywords = [
    this.name,
    this.brand,
    this.category,
    this.genericName,
    this.manufacturer,
    ...safeTags,
  ].filter(Boolean);

  this.searchKeywords = [...new Set(keywords.map((k) => String(k).toLowerCase()))];

  // Keep stockQuantity synced with stock (optional safety)
  if (typeof this.stock === "number") {
    this.stockQuantity = this.stock;
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);
