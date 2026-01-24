const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['vendor', 'delivery', 'customer'], 
    required: true 
  },
  
  // Address - Now as Object for all roles
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true }
  },
  
  // Vehicle Details (for delivery drivers)
  vehicle: {
    type: { type: String },
    number: { type: String },
    model: { type: String }
  },
  
  // Documents (for delivery drivers)
  documents: {
    aadhar: { type: String },
    pan: { type: String },
    drivingLicense: { type: String }
  },
  
  // Vendor specific fields (if any)
  businessName: { type: String },
  gstNumber: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);