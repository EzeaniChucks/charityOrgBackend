const express = require('express')
const {login, register, verifyEmail} = require('../controllers/authControllers');

const router = express.Router();

router.route('/login').post(login)
router.route('/register').post(register)
router.route('/verify-email').post(verifyEmail)


module.exports = router;