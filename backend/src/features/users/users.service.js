const pool = require('../../db/pool');

const listAdmins = async () => {
  const result = await pool.query(
    'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

module.exports = {
  listAdmins
};
