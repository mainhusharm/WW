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
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    screenshots: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screenshot'
    }],
    questionnaireResponses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionnaireResponse'
    }],
    riskManagementPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RiskManagementPlan'
    },
    dashboardData: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DashboardData'
    }],
});

module.exports = mongoose.model('Customer', customerSchema);
