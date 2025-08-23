const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    activity_type: {
        type: String,
        required: true,
    },
    activity_details: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    ip_address: {
        type: String,
    },
});

module.exports = mongoose.model('Activity', activitySchema);
