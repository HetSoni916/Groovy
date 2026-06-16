const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const authenticate = require('../middlewares/authMiddleware');

router.post('/login', validateLogin, login);
router.get('/profile', authenticate, getProfile);

module.exports = router;
