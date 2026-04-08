const express = require("express")
const jwt = require("jsonwebtoken")
require("dotenv/config.js")
const user = require("../models/userModel")
exports.verifyJWt = async function(req,res,next){
    const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        return res.status(400).end("Please enter token!")
    }
    try {
        const decode = jwt.verify(token,process.env.access_token_secret)
        const u = await user.findById(decode?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordToken"
        )
        if(!u){
            res.status(400).end("Invalid access token")
        }
        req.user = u
        next()
    } catch (error) {
        return res.status(400).end("Invalid access token")
    }
}