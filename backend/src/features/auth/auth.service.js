const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../../db/pool');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const login = async ({ username, password }) => {
  const result = await pool.query(
    'SELECT id, username, password_hash, role FROM users WHERE username = $1 LIMIT 1',
    [username]
  );

  if (result.rowCount === 0) {
    throw new ApiError(401, 'Invalid username or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, 'Invalid username or password');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

module.exports = {
  login
};
