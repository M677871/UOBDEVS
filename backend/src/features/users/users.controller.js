const asyncHandler = require('../../utils/asyncHandler');
const usersService = require('./users.service');

const listAdmins = asyncHandler(async (req, res) => {
  const items = await usersService.listAdmins();
  res.json({ items });
});

module.exports = {
  listAdmins
};
