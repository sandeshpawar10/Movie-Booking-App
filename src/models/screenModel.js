const mongoose = require("mongoose")
const {Schema} = require("mongoose")

const screenSchema = new Schema({
    theatre: {
        type: Schema.Types.ObjectId,
        ref: "theatre"
    },
    screenNumber: Number,
    totalSeats: Number,
    seatLayout: [
        {
            seatNumber: String,
            type:{
                type: String,
                enum: ["silver","gold","platinum"]
            }
        }
    ]
})

const screen = mongoose.model("screen",screenSchema)
module.exports = screen