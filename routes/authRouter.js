const express = require('express')
const {register,getMe,reqWithrefreshToken,login,logout,logoutall} = require("../controllers/authController")
const router = express.Router();

router.post('/register',register);
router.get('/auth/me',getMe);
router.get('/auth/refresh',reqWithrefreshToken);
router.post('/auth/login',login);
router.get('/auth/logout',logout);
router.get('/auth/logout-all',logoutall);

module.exports = router;