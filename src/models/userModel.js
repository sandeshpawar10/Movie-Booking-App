const mongoose = require("mongoose")
const {Schema} = require("mongoose")
const bcrypt = require("bcrypt")
const jwt  = require("jsonwebtoken")
const crypto = require("crypto")

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin", "theatreOwner"],
        default: "user"
    },
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    refreshToken:{
        type: String,
        select: false
    },
    forgotPasswordToken:{
        type: String
    },
    forgotPasswordExpiry:{
        type: Date
    },
    emailVerificationToken:{
        type: String
    },
    emailVerificationExpiry:{
        type: Date
    }
},{
    timestamps: true
})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next
    this.password = await bcrypt.hash(this.password,10)
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role
        },
        process.env.access_token_secret,
        {expiresIn: process.env.access_token_expiry}
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.refresh_token_secret,
        {expiresIn: process.env.refresh_token_expiry}
    )
}

userSchema.methods.generateTemporaryToken = function(){
    const token = crypto.randomBytes(32).toString('hex')
    const hashtoken = crypto.createHash("sha256").update(token).digest("hex")
    const tokenexpiry = Date.now()+(20*60*1000)
    return {token,hashtoken,tokenexpiry}
}

const user = mongoose.model("user",userSchema)
module.exports = user