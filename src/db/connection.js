const mongoose = require("mongoose")

const connectDB = async function(connectioURL){
    try {
        await mongoose.connect(connectioURL)
        console.log("MongoDB connected")
    } catch (error) {
        console.error("MongoDB error",error)
    }
}

module.exports = connectDB