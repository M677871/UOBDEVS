const { Pool } = require('pg');
const env = require('../config/env');

const sslEnabled = env.nodeEnv === 'production';

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false
});

module.exports = pool;
