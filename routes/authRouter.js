const express = require('express')
const {register,getMe,reqWithrefreshToken,login} = require("../controllers/authController")
const router = express.Router();

router.post('/register',register);
router.get('/auth/me',getMe);
router.get('/auth/refresh',reqWithrefreshToken);
router.post('/auth/login',login)

module.exports = router;