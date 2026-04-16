const Rozorpay = require("razorpay")
dotenv.config({
    path:"./.env"
})

const rozarpayInstance = new Rozorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

module.exports = rozarpayInstance