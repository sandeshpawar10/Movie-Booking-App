const rozarpay = require("../config/rozarpay")
const booking = require("../models/bookingModel")
const trannsaction = require("../models/transactionModel")
const crypto = require("crypto")
const screen = require("../models/screenModel")
const show = require("../models/showModel")
const user = require("../models/userModel")
const sendEmail = require("../utils/mailer")

exports.getMyTransactions = async function(req, res) {
    try {
        const { userid } = req.params;
        const transactions = await trannsaction.find({ userId: userid }).populate('bookingId').sort({ createdAt: -1 });
        return res.status(200).json({ data: transactions });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
}

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

        const book = await booking.findById(bookingId)
        if (!book) {
            return res.status(404).json({ message: "Booking not found" });
        }

        await trannsaction.create({
            bookingId,
            userId: book.user,
            amount: book.totalAmount,
            paymentMethod: "rozarpay",
            status: "success",
            transactionId: razorpay_payment_id
        })

        const s = await show.findById(book.show)
        if(!s){
            return res.status(404).json({ message: "Show not found" });
        }
        book.bookedSeats.forEach((bookedSeat)=>{
            s.bookedSeats.push(`${bookedSeat.row}${bookedSeat.number}`);
        })

        book.bookingStatus = "confirmed"
        book.paymentStatus = "completed"

        await book.save()
        await s.save()

        // Send confirmation email
        try {
            const u = await user.findById(book.user);
            if (u && u.email) {
                const seatsStr = book.bookedSeats.map(seat => `${seat.row}${seat.number}`).join(', ');
                const movieTitle = s.movieId ? (await require('../models/movieModel').findById(s.movieId))?.title || 'Movie' : 'Movie';
                const showTime = new Date(s.startTime).toLocaleString();
                sendEmail(
                    u.email,
                    `Booking Confirmed - CineMagic`,
                    `Hello ${u.username},\n\nYour booking has been confirmed!\n\nBooking ID: ${book._id}\nMovie: ${movieTitle}\nShow Time: ${showTime}\nSeats: ${seatsStr}\nTotal Paid: ₹${book.totalAmount}\n\nPlease arrive 15 minutes early. Show your QR code at the entrance.\n\nEnjoy the movie!\n- Team CineMagic`
                );
            }
        } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr);
        }

         res.status(200).json({
            message: "Payment verified & booking confirmed"
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}