require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory so HTML files work
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static(uploadDir));

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collegePortal';
if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoURI)
        .then(() => console.log('MongoDB successfully connected'))
        .catch(err => console.error('MongoDB connection error:', err));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/office', require('./routes/office'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

module.exports = app;

if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
