const mongoose = require('mongoose');

const riskManagementPlanSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    plan_data: {
        type: String, // Storing as a JSON string
        required: true,
    },
    updated_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RiskManagementPlan', riskManagementPlanSchema);
