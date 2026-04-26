const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(200)
});

module.exports = {
  loginSchema
};
