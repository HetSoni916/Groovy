const express = require('express');
const { login } = require('../controllers/authController');
const { loginRules, validate } = require('../middlewares/validate');

const router = express.Router();

router.post('/login', loginRules, validate, login);

module.exports = router;
