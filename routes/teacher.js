const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentDetails = require('../models/StudentDetails');
const Attendance = require('../models/Attendance');
const Material = require('../models/Material');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        if(/pdf/.test(path.extname(file.originalname).toLowerCase()) || /pdf/.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Error: Please upload a file with .pdf extension!'));
        }
    }
});

router.use(protect);
router.use(authorize('teacher'));

// @route PUT /api/teacher/profile
router.put('/profile', async (req, res) => {
    try {
        const { name, mobile } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (name) user.name = name;
        if (mobile) user.mobile = mobile;
        await user.save();
        
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route GET /api/teacher/students?sem=X&section=Y
router.get('/students', async (req, res) => {
    try {
        const { sem, section } = req.query;
        let query = {};
        if (sem) query.sem = sem;
        if (section) query.section = section;
        
        const details = await StudentDetails.find(query).populate('user', '-password');
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route POST /api/teacher/attendance
router.post('/attendance', async (req, res) => {
    try {
        const { studentId, subject, status } = req.body;
        
        const attendance = await Attendance.create({
            student: studentId,
            teacher: req.user.id,
            subject,
            status
        });

        if (status === 'Absent') {
            const student = await User.findById(studentId);
            if (student && student.parentMobile) {
                // SMS Mocking
                console.log(`\n================================`);
                console.log(`[SMS NOTIFICATION SENT] To: ${student.parentMobile}`);
                console.log(`Message: "Mr/Ms ${student.name} is absent to collge today."`);
                console.log(`================================\n`);
            }
        }

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route POST /api/teacher/material
router.post('/material', (req, res) => {
    upload.single('pdfFile')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'File upload error' });
        }
        
        try {
            const { subject, sem, type, title } = req.body;
            if (!subject || !sem || !type || !title) {
                return res.status(400).json({ message: 'All form fields (Subject, Semester, Type, Title) are required. Please fill them out.' });
            }

            const content = req.file ? `/uploads/${req.file.filename}` : (req.body.content || '');
            
            const material = await Material.create({
                teacher: req.user.id,
                subject, sem, type, title, content
            });

            res.status(201).json(material);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || 'Unknown Server Error' });
        }
    });
});

module.exports = router;
