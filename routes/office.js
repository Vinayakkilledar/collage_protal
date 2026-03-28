const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentDetails = require('../models/StudentDetails');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all office routes and restrict to 'office' role
router.use(protect);
router.use(authorize('office'));

// @route GET /api/office/students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        const studentIds = students.map(s => s._id);
        const details = await StudentDetails.find({ user: { $in: studentIds } });
        
        const result = students.map(student => {
            const detail = details.find(d => d.user.toString() === student._id.toString());
            return {
                ...student._doc,
                academic: detail || {}
            };
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route PUT /api/office/students/:id
// @desc update student (sem, division, backlogs, etc)
router.put('/students/:id', async (req, res) => {
    try {
        const { sem, section, subjects, backlogs, activeBacklogs } = req.body;
        
        let details = await StudentDetails.findOne({ user: req.params.id });
        if (!details) {
            details = new StudentDetails({ user: req.params.id });
        }
        
        if (sem !== undefined) details.sem = sem;
        if (section !== undefined) details.section = section;
        if (subjects !== undefined) {
             // Handle subjects as array from comma-separated string if provided like that, or direct array
            details.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
        }
        if (backlogs !== undefined) details.backlogs = backlogs;
        if (activeBacklogs !== undefined) details.activeBacklogs = activeBacklogs;
        
        await details.save();
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
