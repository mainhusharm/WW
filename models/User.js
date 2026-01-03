import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  fullName: {
    type: String
  },
  phone: {
    type: String
  },
  company: {
    type: String
  },
  country: {
    type: String
  },
  tradingExperience: {
    type: String
  },
  tradingGoals: {
    type: String
  },
  riskTolerance: {
    type: String
  },
  preferredMarkets: {
    type: String
  },
  tradingStyle: {
    type: String
  },
  agreeToMarketing: {
    type: Boolean,
    default: false
  },
  questionnaireData: {
    type: String
  },
  screenshotUrl: {
    type: String
  },
  riskManagementPlan: {
    type: String
  },
  status: {
    type: String,
    default: 'PENDING'
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: 1 });

export default mongoose.model('User', userSchema);
