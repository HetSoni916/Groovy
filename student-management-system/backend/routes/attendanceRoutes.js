const express = require('express');
const {
  getAttendanceByDate, markAttendance, markBulkAttendance,
  getAttendanceStats, getStudentAttendance, getTodayUnmarked,
} = require('../controllers/attendanceController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/by-date', getAttendanceByDate);
router.get('/stats', getAttendanceStats);
router.get('/today-unmarked', getTodayUnmarked);
router.get('/student/:id', getStudentAttendance);
router.post('/mark', markAttendance);
router.post('/bulk', markBulkAttendance);

module.exports = router;
