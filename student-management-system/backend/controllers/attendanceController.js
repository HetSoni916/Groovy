const AttendanceModel = require('../models/attendanceModel');
const StudentModel = require('../models/studentModel');

const getAttendanceByDate = async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const records = await AttendanceModel.findByDate(targetDate);
  res.json({ date: targetDate, records });
};

const markAttendance = async (req, res) => {
  const { studentId, date, status, remarks } = req.body;
  if (!studentId || !date || !status) {
    return res.status(400).json({ message: 'studentId, date, and status are required' });
  }
  const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status must be Present, Absent, Late, or Excused' });
  }
  const result = await AttendanceModel.markOrUpdate(studentId, date, status, req.user.id, remarks);
  res.json(result);
};

const markBulkAttendance = async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'date and records array are required' });
  }
  const formatted = records.map(r => ({
    ...r,
    date,
  }));
  const results = await AttendanceModel.markBulk(formatted, req.user.id);
  res.json({ count: results.length, records: results });
};

const getAttendanceStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  const stats = await AttendanceModel.getStats(start, end);
  res.json({ startDate: start, endDate: end, ...stats });
};

const getStudentAttendance = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  const records = await AttendanceModel.findByStudentAndDateRange(id, start, end);
  res.json({ studentId: id, startDate: start, endDate: end, records });
};

const getTodayUnmarked = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const marked = await AttendanceModel.findByDate(today);
  const markedIds = marked.map(r => r.student_id);
  const allStudents = await StudentModel.findAll({ search: '', status: 'Active', course: '', page: 1, limit: 1000, sortBy: 'first_name', sortOrder: 'asc' });
  const unmarked = allStudents.students.filter(s => !markedIds.includes(s.id));
  res.json({ date: today, unmarked });
};

module.exports = { getAttendanceByDate, markAttendance, markBulkAttendance, getAttendanceStats, getStudentAttendance, getTodayUnmarked };
