// backend/src/models/Store.js
// Updated Store Model with Multi-Type Support

const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    
    // Basic Info
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    
    // Store Type (NEW)
    storeType: {
      type: String,
      enum: ["general", "medical", "restaurant"],
      default: "general",
    },
    
    // Categories
    category: {
      type: String,
      enum: [
        "grocery", "vegetables", "fruits", "dairy", "bakery", 
        "meat", "fish", "pharmacy", "restaurant", "other"
      ],
      default: "grocery",
    },
    categories: [{ type: String }], // Multiple categories for general stores
    
    // Images
    logo: { type: String, default: "" },
    image: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    images: [{ type: String }],
    
    // Contact
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    
    // Address
    address: {
      street: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
    },
    
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    
    // ==================== MEDICAL STORE SPECIFIC ====================
    medicalInfo: {
      drugLicenseNumber: { type: String, default: "" },
      drugLicenseExpiry: { type: String, default: "" },
      pharmacistName: { type: String, default: "" },
      pharmacistLicense: { type: String, default: "" },
      acceptsPrescription: { type: Boolean, default: true },
      is24Hours: { type: Boolean, default: false },
    },
    
    // ==================== RESTAURANT SPECIFIC ====================
    restaurantInfo: {
      cuisines: [{ type: String }],
      foodType: { 
        type: String, 
        enum: ["veg", "nonveg", "both"], 
        default: "both" 
      },
      avgPrepTime: { type: Number, default: 30 }, // minutes
      seatingCapacity: { type: Number, default: 0 },
      dineIn: { type: Boolean, default: false },
      takeaway: { type: Boolean, default: true },
      tableBooking: { type: Boolean, default: false },
    },
    
    // ==================== BUSINESS HOURS ====================
    businessHours: {
      monday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      tuesday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      wednesday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      thursday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      friday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      saturday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: true } 
      },
      sunday: { 
        open: { type: String, default: "09:00" }, 
        close: { type: String, default: "21:00" }, 
        isOpen: { type: Boolean, default: false } 
      },
    },
    
    // ==================== DELIVERY SETTINGS ====================
    deliverySettings: {
      deliveryRadius: { type: Number, default: 5 }, // km
      minimumOrder: { type: Number, default: 100 },
      deliveryFee: { type: Number, default: 30 },
      freeDeliveryAbove: { type: Number, default: 500 },
      estimatedDeliveryTime: { type: String, default: "30-45 mins" },
    },
    
    // ==================== PAYMENT SETTINGS ====================
    paymentSettings: {
      codEnabled: { type: Boolean, default: true },
      onlinePayment: { type: Boolean, default: true },
    },
    
    // ==================== STATUS ====================
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    
    // ==================== RATINGS ====================
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    
    // ==================== STATS ====================
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    
    // ==================== DOCUMENTS ====================
    documents: {
      gstNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      fssaiLicense: { type: String, default: "" },
      drugLicense: { type: String, default: "" },
      shopLicense: { type: String, default: "" },
    },
    
    // ==================== BANK DETAILS ====================
    bankDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    
    // ==================== SETTINGS ====================
    settings: {
      homeDelivery: { type: Boolean, default: true },
      selfPickup: { type: Boolean, default: true },
      prescriptionRequired: { type: Boolean, default: false },
      autoAcceptOrders: { type: Boolean, default: false },
      notifyOnNewOrder: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Indexes
storeSchema.index({ vendor: 1 });
storeSchema.index({ location: "2dsphere" });
storeSchema.index({ storeType: 1 });
storeSchema.index({ category: 1 });
storeSchema.index({ categories: 1 });
storeSchema.index({ isActive: 1, isApproved: 1 });
storeSchema.index({ "address.city": 1 });
storeSchema.index({ "address.pincode": 1 });

// Virtual for full address
storeSchema.virtual("fullAddress").get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.landmark ? addr.landmark + ", " : ""}${addr.city}, ${addr.state} - ${addr.pincode}`;
});

// Method to check if store is currently open
storeSchema.methods.isCurrentlyOpen = function() {
  if (!this.isOpen || !this.isActive) return false;
  
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = this.businessHours[today];
  
  if (!todayHours || !todayHours.isOpen) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(":").map(Number);
  const [closeHour, closeMin] = todayHours.close.split(":").map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model("Store", storeSchema);