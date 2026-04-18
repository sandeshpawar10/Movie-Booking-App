const mongoose = require("mongoose")
const {Schema} = require("mongoose")


const showSchema = new Schema({
    movie: {
        type: Schema.Types.ObjectId,
        ref: "movie",
        index: true,
        required: true
    },
    theatreId: {
        type: Schema.Types.ObjectId,
        ref: "theatre",
        index: true,
        required: true
    },
    screen: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "screen",
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    price: {
        silver:{
            type: Number,
            required: true
        },
        gold: {
            type: Number,
            required: true
        },
        platinum: {
            type: Number,
            required: true
        }
    },
    bookedSeats: {
            type: [String],
            default: [],
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
                    },
                    isBooked: {
                        type: Boolean,
                        default: false
                    }
                }
            ]
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true
})

const show = mongoose.model("show",showSchema)
module.exports = show