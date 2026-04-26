const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { loginSchema } = require('./auth.validation');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid login payload', parsed.error.flatten());
  }

  const data = await authService.login(parsed.data);
  res.json(data);
});

const me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out. Discard token on client.' });
});

module.exports = {
  login,
  me,
  logout
};
