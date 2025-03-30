// db.js

const { Pool } = require('pg'); // Import PostgreSQL client
const dotenv = require('dotenv');

dotenv.config(); // Load .env variables

// Create a new pool (connection to the database)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Export the pool so other files can use it
module.exports = pool;