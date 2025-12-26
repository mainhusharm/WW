const mongoose = require('mongoose');

const dashboardDataSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    data_type: {
        type: String,
        required: true,
    },
    data_content: {
        type: mongoose.Schema.Types.Mixed, // Storing as a nested object
        required: true,
    },
    last_updated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('DashboardData', dashboardDataSchema);
