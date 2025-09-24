const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    screenshot_type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    screenshot_url: {
        type: String,
        required: true,
    },
    upload_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Screenshot', screenshotSchema);
