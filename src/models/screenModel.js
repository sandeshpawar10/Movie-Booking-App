const mongoose = require("mongoose")
const {Schema} = require("mongoose")

const screenSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    theatreId: {
        type: Schema.Types.ObjectId,
        ref: "theatre",
        required: true
    },
    screenNumber: {
        type: Number,
        required: true
    },
    totalSeats: {
        type: Number,
        required: true
    },
    seatLayout: [
        {
            row:{
                type: String,
                required: true
            },
            seats: [
                {
                    number: Number,
                    type:{
                        type: String,
                        enum: ["silver","gold","platinum"],
                        required: true
                    }
                }
            ]
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
})

const screen = mongoose.model("screen",screenSchema)
module.exports = screen