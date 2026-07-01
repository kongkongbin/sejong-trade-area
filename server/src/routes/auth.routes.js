const express = require('express');
const router = express.Router();
const { login, register, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, me);

module.exports = router;
