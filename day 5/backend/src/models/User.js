const db = require('../config/database');

const User = {
  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return rows[0];
  },

  async create({ email, passwordHash, firstName, lastName }) {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, passwordHash, firstName, lastName]
    );
    return rows[0];
  },

  async updateLastLogin(id) {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  },
};

module.exports = User;
