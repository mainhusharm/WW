const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const customerSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        default: () => `CUS-${uuidv4()}`,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
    },
    account_type: {
        type: String,
    },
    membershipTier: {
        type: String,
        default: 'Standard',
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        default: 'Active',
    },
    // Questionnaire responses
    questionnaireResponses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionnaireResponse'
    }],
    // Risk management plan
    riskManagementPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RiskManagementPlan'
    },
    // Plan selection from pricing page
    selectedPlan: {
        type: String,
        enum: ['Basic', 'Professional', 'Institutional', 'Elite'],
        default: 'Basic'
    },
    // Trading experience level
    tradingExperience: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
    },
    // Account balance range
    accountBalance: {
        type: String,
        enum: ['Under $1K', '$1K-$10K', '$10K-$100K', '$100K+'],
        default: 'Under $1K'
    },
    // Risk tolerance
    riskTolerance: {
        type: String,
        enum: ['Conservative', 'Moderate', 'Aggressive'],
        default: 'Moderate'
    },
    // Trading goals
    tradingGoals: [{
        type: String,
        enum: ['Capital Preservation', 'Income Generation', 'Capital Growth', 'Speculation']
    }],
    // Preferred markets
    preferredMarkets: [{
        type: String,
        enum: ['Forex', 'Crypto', 'Stocks', 'Commodities', 'Indices']
    }],
    // Time availability
    timeAvailability: {
        type: String,
        enum: ['Part-time (1-2 hours/day)', 'Full-time (4-8 hours/day)', '24/7 Monitoring'],
        default: 'Part-time (1-2 hours/day)'
    },
    // Previous trading experience
    hasTradingExperience: {
        type: Boolean,
        default: false
    },
    // Loss tolerance percentage
    maxLossTolerance: {
        type: Number,
        default: 2, // 2% default
        min: 0,
        max: 10
    },
    // Monthly trading budget
    monthlyTradingBudget: {
        type: Number,
        default: 100
    },
    // Maximum position size
    maxPositionSize: {
        type: Number,
        default: 5, // 5% default
        min: 1,
        max: 20
    },
    // Stop loss preference
    stopLossPreference: {
        type: String,
        enum: ['Fixed Percentage', 'ATR-based', 'Support/Resistance', 'Manual'],
        default: 'Fixed Percentage'
    },
    // Take profit strategy
    takeProfitStrategy: {
        type: String,
        enum: ['Fixed R:R Ratio', 'Multiple Targets', 'Trailing Stop', 'Manual'],
        default: 'Fixed R:R Ratio'
    },
    // Risk per trade
    riskPerTrade: {
        type: Number,
        default: 1, // 1% default
        min: 0.1,
        max: 5
    },
    // Maximum open trades
    maxOpenTrades: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
    },
    // Correlation awareness
    correlationAwareness: {
        type: Boolean,
        default: false
    },
    // News trading preference
    newsTradingPreference: {
        type: String,
        enum: ['Avoid News', 'Trade News', 'Wait for News to Settle'],
        default: 'Wait for News to Settle'
    },
    // Weekend trading preference
    weekendTrading: {
        type: Boolean,
        default: false
    },
    // Time zone preference
    timeZonePreference: {
        type: String,
        default: 'UTC'
    },
    // Communication preference
    communicationPreference: {
        type: String,
        enum: ['Email', 'SMS', 'WhatsApp', 'Telegram', 'Phone'],
        default: 'Email'
    },
    // Support level needed
    supportLevelNeeded: {
        type: String,
        enum: ['Basic Support', 'Priority Support', 'VIP Support', 'Dedicated Manager'],
        default: 'Basic Support'
    },
    // Additional notes
    additionalNotes: {
        type: String
    },
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    screenshots: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screenshot'
    }],
    dashboardData: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DashboardData'
    }],
});

module.exports = mongoose.model('Customer', customerSchema);
