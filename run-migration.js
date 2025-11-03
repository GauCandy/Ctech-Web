// Script to run database migrations
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'backend', 'database', 'migrations', 'create_shared_schedules_table.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');

    console.log('Running migration: create_shared_schedules_table.sql');

    // Execute the migration
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
