const mongoose = require("mongoose")
const {Schema} = require("mongoose")
//const { title } = require("node:process")
//const { required } = require("zod/mini")

const movieShcema = new Schema({
    title:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    descrition: String,
    releaseDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    genre:[String],
    language:{
        type: String,
        required: true
    },
    poster: String,
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "user" //admin
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps:true
})

const movie = mongoose.model("movie",movieShcema)
module.exports = movie