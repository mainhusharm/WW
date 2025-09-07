const mongoose = require('mongoose');

const riskManagementPlanSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    // Plan name from the 4 options
    planName: {
        type: String,
        enum: ['Conservative', 'Balanced', 'Aggressive', 'Custom'],
        required: true,
        default: 'Balanced'
    },
    // Plan description
    planDescription: {
        type: String,
        required: true
    },
    // Risk parameters
    maxRiskPerTrade: {
        type: Number,
        required: true,
        min: 0.1,
        max: 5,
        default: 1
    },
    maxDailyLoss: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 3
    },
    maxWeeklyLoss: {
        type: Number,
        required: true,
        min: 5,
        max: 20,
        default: 10
    },
    maxMonthlyLoss: {
        type: Number,
        required: true,
        min: 10,
        max: 30,
        default: 20
    },
    // Position sizing
    maxPositionSize: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
        default: 5
    },
    maxOpenTrades: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 3
    },
    // Stop loss settings
    stopLossType: {
        type: String,
        enum: ['Fixed Percentage', 'ATR-based', 'Support/Resistance', 'Manual'],
        required: true,
        default: 'Fixed Percentage'
    },
    defaultStopLoss: {
        type: Number,
        required: true,
        min: 0.5,
        max: 10,
        default: 2
    },
    // Take profit settings
    takeProfitType: {
        type: String,
        enum: ['Fixed R:R Ratio', 'Multiple Targets', 'Trailing Stop', 'Manual'],
        required: true,
        default: 'Fixed R:R Ratio'
    },
    defaultRiskReward: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 2
    },
    // Market conditions
    preferredMarkets: [{
        type: String,
        enum: ['Forex', 'Crypto', 'Stocks', 'Commodities', 'Indices'],
        required: true
    }],
    avoidMarkets: [{
        type: String,
        enum: ['Forex', 'Crypto', 'Stocks', 'Commodities', 'Indices']
    }],
    // Time restrictions
    tradingHours: {
        start: {
            type: String,
            default: '09:00'
        },
        end: {
            type: String,
            default: '17:00'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    avoidNewsEvents: {
        type: Boolean,
        default: true
    },
    avoidWeekends: {
        type: Boolean,
        default: true
    },
    // Correlation rules
    maxCorrelatedPairs: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 2
    },
    correlationThreshold: {
        type: Number,
        required: true,
        min: 0.5,
        max: 0.9,
        default: 0.7
    },
    // Volatility filters
    minVolatility: {
        type: Number,
        required: true,
        min: 0.5,
        max: 5,
        default: 1
    },
    maxVolatility: {
        type: Number,
        required: true,
        min: 5,
        max: 20,
        default: 15
    },
    // Trend filters
    trendConfirmation: {
        type: Boolean,
        default: true
    },
    minTrendStrength: {
        type: Number,
        required: true,
        min: 0.1,
        max: 1,
        default: 0.6
    },
    // Money management
    accountBalanceThreshold: {
        type: Number,
        required: true,
        min: 100,
        max: 10000,
        default: 1000
    },
    monthlyProfitTarget: {
        type: Number,
        required: true,
        min: 5,
        max: 50,
        default: 20
    },
    // Recovery rules
    lossRecoveryMode: {
        type: Boolean,
        default: false
    },
    recoveryRiskReduction: {
        type: Number,
        required: true,
        min: 0.1,
        max: 1,
        default: 0.5
    },
    // Plan data (legacy field for backward compatibility)
    plan_data: {
        type: String, // Storing as a JSON string
        required: true,
    },
    // Plan status
    isActive: {
        type: Boolean,
        default: true
    },
    // Plan version
    version: {
        type: String,
        default: '1.0'
    },
    updated_date: {
        type: Date,
        default: Date.now,
    },
    created_date: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('RiskManagementPlan', riskManagementPlanSchema);
