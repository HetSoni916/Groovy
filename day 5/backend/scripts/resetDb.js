require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const { pool } = require(path.join(__dirname, '..', 'src', 'config', 'database'));

const resetDb = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS students CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP SEQUENCE IF EXISTS student_id_seq');
    console.log('Tables dropped successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
};

resetDb();
