const mongoose = require("mongoose")
const {Schema} = require("mongoose")


const showSchema = new Schema({
    movie: {
        type: Schema.Types.ObjectId,
        ref: "movie",
        index: true,
        required: true
    },
    theatre: {
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
    seatsAvailble: {
            type: [String],
            default: [],
            required: true
        },
},{
    timestamps: true
})

const show = mongoose.model("show",showSchema)
module.exports = show