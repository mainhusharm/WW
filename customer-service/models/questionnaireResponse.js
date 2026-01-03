const mongoose = require('mongoose');

const questionnaireResponseSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    response_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('QuestionnaireResponse', questionnaireResponseSchema);
