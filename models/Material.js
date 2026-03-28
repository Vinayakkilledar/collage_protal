const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    sem: { type: String, required: true },
    type: { type: String, enum: ['Note', 'Assignment', 'Feedback'], required: true },
    title: { type: String, required: true },
    content: { type: String }, // Could be a link or raw text
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', materialSchema);
