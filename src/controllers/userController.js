const user = require("../models/userModel")
const {sendEmail, emailVerificationmailcontent,forgotPassowrdmailcontent} = require("../utils/mail")
const {userValidation,loginValidationFunction, emailValidations, passwordValidations,oldNewpasswordValidations} = require("../validations/userRegsitrationValidation")
const crypto = require("crypto");

const generateAccessAndRefreshTokens = async function(u){
    try {
        //const u = await user.findById(userId)
        const accesstoken = u.generateAccessToken()
        const refreshtoken = u.generateRefreshToken()
        u.refreshToken = refreshtoken
        await u.save({validateBeforeSave:false})
        return {accesstoken,refreshtoken}
    } catch (error) {
        throw new Error("Something gets wrong while generating the tokens")
    }
}

exports.registerUser = async function(req,res){
    //console.log("REGISTER API HIT");
    const validationResult = await userValidation.safeParseAsync(req.body)

    if(validationResult.error){
        return res.status(400).json({Error: validationResult.error.format()})
    }

    const {username, email, password,role} = validationResult.data
    //console.log("EMAIL:", email)
    const existingUser = await user.findOne({
        email
    })
    if(existingUser){
        return res.status(400).end("User is already registered")
    }
    const u = await user.create({
        email,
        password,
        username,
        role,
        isEmailVerified: false
    })

    const {token,hashtoken,tokenexpiry} = u.generateTemporaryToken()

    u.emailVerificationToken = hashtoken
    u.emailVerificationExpiry = tokenexpiry

    await u.save({validateBeforeSave: false})

    sendEmail({
        email: u?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationmailcontent(
            u.username,
            `${req.protocol}://${req.get("host")}/user/verifyemail/${token}`
        )
    })

    const createduser = await user.findById(u._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordToken"
    )

    if(!createduser){
        throw new Error("Something went wrong while registering the user")
    }

    return res.status(201).json({message: "User registered successfully and email has been sent to you", user: createduser})
}


exports.loginuser = async function(req,res){
    const validationResult = await loginValidationFunction.safeParseAsync(req.body)

    if(validationResult.error){
        return res.status(400).json({Error: validationResult.error.format()})
    }

    const {email, password} = validationResult.data

    const u = await user.findOne({
        email
    })
    if(!u){
        return res.status(400).end("User is not registered")
    }

    if(!u.isEmailVerified){
        return res.status(403).end("Please verify your email first");
    }

    const passwordValid = await u.isPasswordCorrect(password)
    
    if(!passwordValid){
        return res.status(400).end("Invalid credentials")
    }

    const {accesstoken, refreshtoken} = await generateAccessAndRefreshTokens(u)

    const loggedinuser = await user.findById(u._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordToken"
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV
    }

    return res.status(200).cookie("accesstoken",refreshtoken,options).cookie("refreshtoken",refreshtoken,options).json({user: loggedinuser,
        AccesssToken: accesstoken,
        Status: "User successfully logged in."
    })
}

exports.logoutuser = async function(req,res){
    await user.findByIdAndUpdate(req.user._id,
    {
        $set:{
            refreshToken: ""
        },
    },
    {
        new: true
    })
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV
    }
    return res.status(200).clearCookie("accesstoken",options).clearCookie("refreshtoken",options).
    end("User is successfully logged out.")
}

exports.getcurrentuser = async function(req,res){
    return res.status(200).json({CurrentUser: req.user})
}

exports.verifyEmail = async function(req,res){
    const {verificationToken} = req.params
    if(!verificationToken){
        return res.status(400).end("Email verification token is missing.")
    }
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")
    const u = await user.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: {$gt: Date.now()}
    })
    if(!u){
        return res.status(400).end("Token has been expired.")
    }
    u.emailVerificationToken = undefined
    u.emailVerificationExpiry = undefined
    u.isEmailVerified = true
    await u.save({validateBeforeSave: false})
    return res.status(200).end("Email is verified.")
}

exports.resendEmailVerification = async function(req,res){
    const u = await user.findById(req.user._id)
    if(!u){
        return res.status(400).end("User not found")
    }
    if(u.isEmailVerified){
        return res.status(400).end("Email is already verified.")
    }
    const {token,hashtoken,tokenexpiry} = u.generateTemporaryToken()

    u.emailVerificationToken = hashtoken
    u.emailVerificationExpiry = tokenexpiry

    await u.save({validateBeforeSave: false})

    await sendEmail({
        email: u?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationmailcontent(
            u.username,
            `${req.protocol}://${req.get("host")}/user/verifyemail/${token}`
        )
    })

    return res.status(200).end("Email is resend to your email address.")
}

exports.refreshaccesstoken = async function(req,res){
    try {
        const incomingrefreshtoken = req.cookies.refreshtoken || req.header("Authorization")?.replace("Bearer ", "")
        if(!incomingrefreshtoken){
            return res.status(400).end("Refresh token is missing.")
        }
        //console.log(incomingrefreshtoken)
        const u = await user.findOne({
            refreshToken: incomingrefreshtoken
        })
        if(!u){
            return res.status(400).end("Invalid refresh token or Refresh token is expired.")
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV,
            samesite: "lax"
        }
        const {accesstoken, refreshtoken: newrefreshtoken} = await generateAccessAndRefreshTokens(u)
        u.refreshToken = newrefreshtoken
        await u.save()
        return res.status(200).cookie("accesstoken",refreshtoken,options).cookie("refreshtoken",newrefreshtoken,options).json({user: u,
            AccesssToken: accesstoken,
            Status: "Tokens are succesfully refreshed."
        })
    } catch (error) {
        console.log("ERROR:", error)
        return res.status(400).end("Invalid refresh token.")
    }
}

//forgot password function only sends the forgot password email to user
exports.forgotPasswordFunction = async function(req,res){
    const validationResult = await emailValidations.safeParseAsync(req.body)

    if(validationResult.error){
        return res.status(400).json({Error: validationResult.error.format()})
    }

    const {email} = validationResult.data
    const u = await user.findOne({email})
    if(!u){
        return res.status(400).end("Invalid email so user not found.")
    }

    const {token,hashtoken,tokenexpiry} = u.generateTemporaryToken()
    u.forgotPasswordToken = hashtoken
    u.forgotPasswordExpiry = tokenexpiry

    await u.save({validateBeforeSave: false})

    await sendEmail({
        email: u?.email,
        subject: "Reset password.",
        mailgenContent: forgotPassowrdmailcontent(
            u.username,
            `${req.protocol}://${req.get("host")}/user/resetpassword/${token}`
        )
    })

    return res.status(200).end("Password reset email has been sent to your mail id")

}

exports.resetPasswordFunction = async function(req,res){
    const {resetToken} = req.params
    if(!resetToken){
        return res.status(400).end("Enter reset token.")
    }
    const validationResult = await passwordValidations.safeParseAsync(req.body)

    if(validationResult.error){
        return res.status(400).json({Error: validationResult.error.format()})
    }

    const {password: newPassword} = validationResult.data
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    const u = await user.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    })
    if(!u){
        return res.status(400).end("Token has been expired.")
    }
    u.forgotPasswordToken = undefined
    u.forgotPasswordExpiry = undefined
    u.password = newPassword

    await u.save({validateBeforeSave: false})
    return res.status(200).end("Password reset successfuly.")
}

exports.changeCurrentPasswordFunction = async function(req,res){
    const u = await user.findById(req.user._id)
    if(!u){
        return res.status(400).end("User not found")
    }
    
    const validationResult = await oldNewpasswordValidations.safeParseAsync(req.body)

    if(validationResult.error){
        return res.status(400).json({Error: validationResult.error.format()})
    }

    const {oldPassword,newPassword} = validationResult.data

    

    const isPasswordValid = await u.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        return res.status(400).end("Incorrect password")
    }

    u.password = newPassword
    await u.save({validateBeforeSave: false})

    return res.status(200).end("Password changed successfully.")
}