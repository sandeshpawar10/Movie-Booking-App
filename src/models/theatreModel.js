const mongoose = require("mongoose")
const {Schema} = require("mongoose")

const theatreSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "user" //theatreOwner
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true
})

const theatre = mongoose.model("theatre",theatreSchema)
module.exports = theatre