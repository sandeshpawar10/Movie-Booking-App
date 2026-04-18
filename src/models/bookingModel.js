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
    bookedSeats: [
        {
            row: {
                type: String,
                required: true
            },
            number: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ["silver", "gold", "platinum"],
                required: true
            }
        }
    ],
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
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    }
},{
    timestamps: true
})

const booking = mongoose.model("booking",bookingSchema)
module.exports = booking