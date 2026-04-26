const express = require('express');
const controller = require('./users.controller');
const { requireAuth, requireAdmin } = require('../auth/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/admins', controller.listAdmins);

module.exports = router;
