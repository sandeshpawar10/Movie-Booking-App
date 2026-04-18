const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true 
    },
    bookingId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["card","upi","netbanking"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending","success","failed"],
        default: "pending"
    },
    transactionId: {
        type: String
    }
},{
    timestamps: true
})

module.exports = mongoose.model("trannsaction",transactionSchema)