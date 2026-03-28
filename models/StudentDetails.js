const mongoose = require('mongoose');

const studentDetailsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sem: { type: String }, // e.g., '1', '2', ..., '8'
    section: { type: String }, // A, B, C
    subjects: [{ type: String }], // Array of subject names
    backlogs: { type: Number, default: 0 },
    activeBacklogs: { type: Number, default: 0 }
});

module.exports = mongoose.model('StudentDetails', studentDetailsSchema);
