require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const db = require('./config/database');
const authService = require('./services/authService');

const PORT = process.env.PORT || 5000;

const runSchema = async () => {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await db.query(schema);
  console.log('Database schema applied');
};

const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    console.log('Database connected successfully');

    // Run schema
    await runSchema();

    // Seed admin user
    await authService.seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
