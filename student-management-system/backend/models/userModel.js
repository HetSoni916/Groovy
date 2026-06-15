const db = require('../config/db');

const UserModel = {
  findByEmail: async (email) => {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;
