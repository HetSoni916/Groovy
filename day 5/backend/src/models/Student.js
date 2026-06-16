const db = require('../config/database');

const Student = {
  async findAll({ search, status, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ['s.is_deleted = FALSE'];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        s.first_name ILIKE $${params.length} OR
        s.last_name ILIKE $${params.length} OR
        s.email ILIKE $${params.length} OR
        s.course ILIKE $${params.length}
      )`);
    }

    if (status) {
      params.push(status);
      conditions.push(`s.status = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const allowedSortColumns = {
      student_id: 's.student_id',
      first_name: 's.first_name',
      last_name: 's.last_name',
      email: 's.email',
      course: 's.course',
      status: 's.status',
      enrollment_date: 's.enrollment_date',
      created_at: 's.created_at',
    };

    const sortColumn = allowedSortColumns[sortBy] || 's.created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM students s WHERE ${whereClause}`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count, 10);

    const dataQuery = `
      SELECT s.*, u.first_name AS created_by_first_name, u.last_name AS created_by_last_name
      FROM students s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const { rows } = await db.query(dataQuery, params);

    return {
      students: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT s.*, u.first_name AS created_by_first_name, u.last_name AS created_by_last_name
       FROM students s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1 AND s.is_deleted = FALSE`,
      [id]
    );
    return rows[0];
  },

  async findByStudentId(studentId) {
    const { rows } = await db.query(
      'SELECT * FROM students WHERE student_id = $1 AND is_deleted = FALSE',
      [studentId]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM students WHERE email = $1 AND is_deleted = FALSE',
      [email]
    );
    return rows[0];
  },

  async generateStudentId() {
    const { rows } = await db.query("SELECT nextval('student_id_seq') AS seq");
    const seq = parseInt(rows[0].seq, 10);
    const year = new Date().getFullYear();
    return `STU${year}${String(seq).padStart(5, '0')}`;
  },

  async create(data) {
    const studentId = await this.generateStudentId();
    const { rows } = await db.query(
      `INSERT INTO students (
        student_id, first_name, last_name, email, phone,
        date_of_birth, gender, address, course, enrollment_date, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        studentId,
        data.first_name,
        data.last_name,
        data.email,
        data.phone,
        data.date_of_birth,
        data.gender,
        data.address,
        data.course,
        data.enrollment_date,
        data.status || 'Active',
        data.created_by,
      ]
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'student_id') {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const { rows } = await db.query(
      `UPDATE students SET ${fields.join(', ')} WHERE id = $${idx} AND is_deleted = FALSE RETURNING *`,
      values
    );
    return rows[0];
  },

  async softDelete(id) {
    const { rows } = await db.query(
      `UPDATE students SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, status = 'Inactive'
       WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
      [id]
    );
    return rows[0];
  },

  async getStats() {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_deleted = FALSE) AS total_students,
        COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'Active') AS active_students,
        COUNT(*) FILTER (
          WHERE is_deleted = FALSE
          AND enrollment_date >= DATE_TRUNC('month', CURRENT_DATE)
        ) AS new_admissions_this_month
      FROM students
    `);
    return rows[0];
  },
};

module.exports = Student;
