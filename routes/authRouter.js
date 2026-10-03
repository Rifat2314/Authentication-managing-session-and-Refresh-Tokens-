const express = require('express')
const {register,getMe,reqWithrefreshToken} = require("../controllers/authController")
const router = express.Router();

router.post('/register',register);
router.get('/auth/me',getMe);
router.get('/auth/refresh',reqWithrefreshToken);

module.exports = router;