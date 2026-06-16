require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require(path.join(__dirname, '..', 'src', 'config', 'database'));

const runSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('Schema executed successfully');
  } catch (error) {
    console.error('Schema execution error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSchema();
