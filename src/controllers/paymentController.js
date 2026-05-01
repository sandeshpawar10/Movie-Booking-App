const rozarpay = require("../config/rozarpay")
const booking = require("../models/bookingModel")
const trannsaction = require("../models/transactionModel")
const crypto = require("crypto")
const screen = require("../models/screenModel")
const show = require("../models/showModel")

exports.createOrder = async function(req,res){
    try {
        const {bookingid} = req.body

        const book = await booking.findById(bookingid)

        if(!book){
            return res.status(404).json({ message: "Booking not found" });
        }

        const options = {
            amount: book.totalAmount*100,
            currency: "INR",
            receipt: `receipt_${bookingid}`
        }

        const order = await rozarpay.orders.create(options)

        res.status(200).json({
            success: true,
            order
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.verifyPayment = async function(req,res){
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body

        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex")

        if(expectedSignature !== razorpay_signature){
            return res.status(400).json({
                Message: "Invalid Payment"
            })
        }

        await trannsaction.create({
            bookingId,
            paymentMethod: "rozarpay",
            status: "success",
            transactionId: razorpay_payment_id
        })

        const book = await booking.findById(bookingId)

        const s = await show.findById(book.show)
        if(!s){
            return res.status(404).json({ message: "Show not found" });
        }
        book.bookedSeats.forEach((bookedSeat)=>{
            const rowdata = s.seatLayout.find(
                (r)=>r.row===bookedSeat.row
            )

            if (!rowData) throw new Error("Row not found");



            const seat = rowData.seats.find( (s) => s.number === bookedSeat.number );

            if (!seat) throw new Error("Seat not found");


            seat.isBooked = true;
        })

        book.bookingStatus = "confirmed"
        book.paymentStatus = "completed"

        await book.save()

         res.status(200).json({
            message: "Payment verified & booking confirmed"
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}