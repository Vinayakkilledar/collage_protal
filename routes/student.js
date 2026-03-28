const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentDetails = require('../models/StudentDetails');
const Attendance = require('../models/Attendance');
const Material = require('../models/Material');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('student'));

// @route GET /api/student/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { sem } = req.query;
        if (!sem) return res.status(400).json({ message: 'Semester is required' });

        const details = await StudentDetails.findOne({ user: req.user.id }).populate('user', '-password');
        if (!details) return res.status(404).json({ message: 'Student details not found. Please contact Office.' });

        if (details.sem !== sem) {
            return res.status(403).json({ message: `Access Denied. You are not assigned to Sem ${sem}.` });
        }

        const attendance = await Attendance.find({ student: req.user.id });
        const materials = await Material.find({ sem: details.sem }); // Materials for their sem

        // Calculate attendance %
        let attendanceStats = {};
        attendance.forEach(att => {
            if (!attendanceStats[att.subject]) {
                attendanceStats[att.subject] = { total: 0, present: 0 };
            }
            attendanceStats[att.subject].total += 1;
            if (att.status === 'Present') {
                attendanceStats[att.subject].present += 1;
            }
        });

        // Add percentages
        for (let sub in attendanceStats) {
            attendanceStats[sub].percentage = ((attendanceStats[sub].present / attendanceStats[sub].total) * 100).toFixed(2);
        }

        res.json({
            profile: details,
            attendanceStats,
            materials,
            backlogs: details.backlogs,
            activeBacklogs: details.activeBacklogs
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
