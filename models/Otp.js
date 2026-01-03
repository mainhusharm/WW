import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'otps'
});

// Add indexes
otpSchema.index({ email: 1 });
otpSchema.index({ code: 1 });
otpSchema.index({ expiresAt: 1 });

export default mongoose.model('Otp', otpSchema);
