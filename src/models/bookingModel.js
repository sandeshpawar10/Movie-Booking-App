const mongoose = require("mongoose")
const {Schema} = require("mongoose")

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    show:{
        type: Schema.Types.ObjectId,
        ref: "show",
        required: true
    },
    seats:{
        type: [String],
        required: true
    },
    totalAmount:{
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending","completed","failed"],
        default: "pending"
    },
    bookingStatus: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed"
    }
},{
    timestamps: true
})

const booking = mongoose.model("booking",bookingSchema)
module.exports = bookingSchema