const db = require('../config/db');

const StudentModel = {
  generateStudentId: async () => {
    const year = new Date().getFullYear();
    const { rows } = await db.query(
      `SELECT student_id FROM students WHERE student_id LIKE $1 ORDER BY student_id DESC LIMIT 1`,
      [`STU-${year}%`]
    );
    if (!rows.length) return `STU-${year}0001`;
    const last = parseInt(rows[0].student_id.slice(-4), 10);
    return `STU-${year}${String(last + 1).padStart(4, '0')}`;
  },

  findAll: async ({ search, status, course, page, limit, sortBy, sortOrder }) => {
    const offset = (page - 1) * limit;
    const allowed = ['first_name', 'last_name', 'email', 'course', 'enrollment_date', 'status', 'created_at'];
    const col = allowed.includes(sortBy) ? sortBy : 'created_at';
    const dir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const conditions = ['is_deleted = FALSE'];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR course ILIKE $${params.length})`
      );
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (course) {
      params.push(`%${course}%`);
      conditions.push(`course ILIKE $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const countResult = await db.query(`SELECT COUNT(*) FROM students WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM students WHERE ${where} ORDER BY ${col} ${dir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { students: rows, total };
  },

  findById: async (id) => {
    const { rows } = await db.query(
      'SELECT * FROM students WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const {
      student_id, first_name, last_name, email, phone,
      date_of_birth, gender, address, course, enrollment_date, status,
    } = data;
    const { rows } = await db.query(
      `INSERT INTO students
        (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, course, enrollment_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [student_id, first_name, last_name, email, phone, date_of_birth, gender, address, course, enrollment_date, status || 'Active']
    );
    return rows[0];
  },

  update: async (id, data) => {
    const {
      first_name, last_name, email, phone,
      date_of_birth, gender, address, course, enrollment_date, status,
    } = data;
    const { rows } = await db.query(
      `UPDATE students SET
        first_name=$1, last_name=$2, email=$3, phone=$4,
        date_of_birth=$5, gender=$6, address=$7, course=$8,
        enrollment_date=$9, status=$10, updated_at=NOW()
       WHERE id=$11 AND is_deleted = FALSE
       RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth, gender, address, course, enrollment_date, status, id]
    );
    return rows[0] || null;
  },

  softDelete: async (id) => {
    const { rows } = await db.query(
      'UPDATE students SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND is_deleted = FALSE RETURNING id',
      [id]
    );
    return rows[0] || null;
  },

  getStats: async () => {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_deleted = FALSE) AS total,
        COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'Active') AS active,
        COUNT(*) FILTER (WHERE is_deleted = FALSE AND DATE_TRUNC('month', enrollment_date) = DATE_TRUNC('month', NOW())) AS new_this_month
      FROM students
    `);
    return rows[0];
  },
};

module.exports = StudentModel;
