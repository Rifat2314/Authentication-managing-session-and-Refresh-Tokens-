const userModel = require('../models/helloUser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const sessionModel = require('../models/sessionModel')
dotenv.config()


const register = async (req,res) => {
    const {username,email,password} = req.body;
    const isAlreadyRegistered = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(isAlreadyRegistered){
        res.status(409).json({
            message:"Username or email already exist"
        })
    }
    const hashpassword = crypto.createHash("sha256").update(password).digest("hex");
    const user = await userModel.create({
        username,
        email,
        password:hashpassword
    })

    const refreshToken = jwt.sign({
    id:user._id
    },process.env.jwt_secret,{
            expiresIn:"7d"
    })


    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user:user._id,
        refreshTokenHash,
        ip:req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id:user._id,
        sessionId:session._id,
    },process.env.jwt_secret,{
        expiresIn:"15m"
    })



    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000 // 7 days
    })

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username:user.username,
            email:user.email,
        },
        accessToken //accessToken memory te store kortesi
    })
    
}


const login = async (req,res) => {
    const {email,password} = req.body;

    const user = await userModel.findOne({email});

    if(!user){
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const hashpassword = crypto.createHash("sha256").update(password).digest("hex");

    const ispasswordValid = hashpassword ===user.password;

    if(!ispasswordValid){
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id:user._id
    },process.env.jwt_secret,{
        expiresIn:"7d"
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user:user._id,
        refreshTokenHash,
        ip:req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id:user._id,
        sessionId: session._id
    },process.env.jwt_secret,{
        expiresIn:"15m"
    })

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000 // 7 days
    })

    res.status(200).json({
        message:"Logged in successfully",
        user:{
            username:user.username,
            email:user.email
        },
        accessToken,
    })
}

const getMe = async (req,res) => {
    try{
        const token = req.headers.authorization?.split(" ")[1];

        const decoded = jwt.verify(token,process.env.jwt_secret)

        const user = await userModel.findById(decoded.id)

        res.status(200).json({
            message: "user fetched successfully",
            user:{
                username:user.username,
                email:user.email
            }
        })
    }
    catch(err) {
        return res.status(401).json({
            message: "Token not found"
        })
    }
    
}

const reqWithrefreshToken = async (req,res) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({
            message: "Refresh token is not found.."
        })
    }

    const decoded = jwt.verify(refreshToken,process.env.jwt_secret)
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked:false,
    })

    if(!session){
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }

    const accessToken = jwt.sign({
        id:decoded._id
    },process.env.jwt_secret,{
        expiresIn:"15m"
    })

    const newRefreshToken = jwt.sign({
        id:decoded._id
    },process.env.jwt_secret,{
        expiresIn:"7d"
    })

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken",newRefreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge:7*24*60*60*1000 // 7 days
    })

    res.status(200).json({
        message:"Access token refresh successfully",
        accessToken
    })
}

const logout = async (req,res) =>{
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out successfully"
    })
}

const logoutall = async (req,res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        revoked: true
    })

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out from all devices successfully"
    })
}

module.exports = {register, getMe, reqWithrefreshToken, login, logout, logoutall};