// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String,
    trim: true
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,  // This creates the index automatically
    trim: true
  },
  email: { 
    type: String, 
    unique: true,
    sparse: true,  // Allows null/undefined values while maintaining uniqueness
    trim: true,
    lowercase: true
  },
  role: { 
    type: String, 
    enum: ['customer', 'vendor', 'delivery'], 
    default: 'customer',
    required: true
  },
  firebaseUid: { 
    type: String, 
    unique: true,  // This creates the index automatically
    required: true
  },
  address: { 
    type: String,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  profileImage: {
    type: String
  },
  // Additional fields for vendors
  vendorDetails: {
    businessName: String,
    businessType: String,
    gstNumber: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String
    }
  },
  // Additional fields for delivery partners
  deliveryDetails: {
    vehicleType: String,
    vehicleNumber: String,
    licenseNumber: String,
    isAvailable: { type: Boolean, default: true }
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

// IMPORTANT: Don't add these - they create duplicate indexes
// userSchema.index({ phone: 1 }, { unique: true }); // ❌ Remove this
// userSchema.index({ email: 1 }, { unique: true }); // ❌ Remove this
// userSchema.index({ firebaseUid: 1 }, { unique: true }); // ❌ Remove this

// Virtual for full name or display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.phone;
});

// Method to check if user is vendor
userSchema.methods.isVendor = function() {
  return this.role === 'vendor';
};

// Method to check if user is delivery partner
userSchema.methods.isDeliveryPartner = function() {
  return this.role === 'delivery';
};

// Static method to find by phone
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

// Static method to find by firebase UID
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

module.exports = mongoose.model('User', userSchema);