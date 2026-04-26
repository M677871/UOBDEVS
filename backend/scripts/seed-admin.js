const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function run() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD are required in environment variables');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `
    INSERT INTO users (username, password_hash, role)
    VALUES ($1, $2, 'admin')
    ON CONFLICT (username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
    `,
    [username, passwordHash]
  );

  console.log(`Admin user seeded: ${username}`);
  await pool.end();
}

run().catch((error) => {
  console.error('Failed to seed admin:', error);
  process.exit(1);
});
