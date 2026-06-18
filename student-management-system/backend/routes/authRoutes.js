const express = require('express');
const { login, logout } = require('../controllers/authController');
const { loginRules, validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', loginRules, validate, login);
router.post('/logout', authenticate, logout);

module.exports = router;
