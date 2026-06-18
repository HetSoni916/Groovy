const db = require('../config/db');

const AttendanceModel = {
  findByDate: async (date) => {
    const { rows } = await db.query(
      `SELECT a.*, s.first_name, s.last_name, s.student_id, s.course
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.date = $1
       ORDER BY s.first_name, s.last_name`,
      [date]
    );
    return rows;
  },

  findByStudentAndDateRange: async (studentId, startDate, endDate) => {
    const { rows } = await db.query(
      `SELECT * FROM attendance
       WHERE student_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date`,
      [studentId, startDate, endDate]
    );
    return rows;
  },

  markOrUpdate: async (studentId, date, status, markedBy, remarks) => {
    const { rows } = await db.query(
      `INSERT INTO attendance (student_id, date, status, marked_by, remarks)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, date)
       DO UPDATE SET status = $3, marked_by = $4, remarks = $5, updated_at = NOW()
       RETURNING *`,
      [studentId, date, status, markedBy, remarks]
    );
    return rows[0];
  },

  markBulk: async (records, markedBy) => {
    const results = [];
    for (const r of records) {
      const result = await AttendanceModel.markOrUpdate(r.studentId, r.date, r.status, markedBy, r.remarks);
      results.push(result);
    }
    return results;
  },

  getStats: async (startDate, endDate) => {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Present') AS present,
         COUNT(*) FILTER (WHERE status = 'Absent') AS absent,
         COUNT(*) FILTER (WHERE status = 'Late') AS late,
         COUNT(*) FILTER (WHERE status = 'Excused') AS excused,
         COUNT(DISTINCT date) AS total_days,
         COUNT(DISTINCT student_id) AS total_students
       FROM attendance
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );
    return rows[0];
  },

  getAttendanceByDateRange: async (startDate, endDate) => {
    const { rows } = await db.query(
      `SELECT a.*, s.first_name, s.last_name, s.student_id, s.course
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.date >= $1 AND a.date <= $2
       ORDER BY a.date, s.first_name, s.last_name`,
      [startDate, endDate]
    );
    return rows;
  },
};

module.exports = AttendanceModel;
