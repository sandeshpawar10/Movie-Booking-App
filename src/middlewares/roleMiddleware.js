const express = require("express")
exports.auth0rizedRoles = (...allowedRoles)=>{
    return (req,res,next)=>{
        if(!req.user){
            return res.status(400).end("User is not authorized")
        }
        if(!allowedRoles.includes(req.user.role)){
            return res.status(400).end("Forbidden")
        }
        next()
    }
}

exports.checkAdmin = (req,res,next)=>{
    if(req.user.role!=="admin"){
        return res.status(400).json({Message: "Access denied. Admin only."})
    }
    next()
}

