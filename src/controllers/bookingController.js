const booking = require("../models/bookingModel")
const show = require("../models/showModel")
const user = require("../models/userModel")
const screen = require("../models/screenModel")

exports.createBooking = async function(req,res){
    try {
        const { showId, seats} = req.body

        const userId = req.user._id 

        const u = await user.findById(userId)

        if(!u){
            return res.status(404).json({ message: "User not found" });
        }

        const s = await show.findById(showId)

        if(!s){
            return res.status(404).json({ message: "Show not found" });
        }

        const screenid = await screen.findById(s.screenId)

        if (!screenid) {
            return res.status(404).json({ message: "Screen not found" });
        }

        //console.log(screenid.seatLayout)

        if (!screenid.seatLayout || screenid.seatLayout.length === 0) {
            return res.status(400).json({ message: "Seat layout missing in screen" });
        }

        

        // if(!screen){
        //     return res.status(404).json({ message: "Screen not found" });
        // }

        const seatLayout = screenid.seatLayout.map(row => ({
            row: row.row,
            seats: row.seats.map(seat => ({
                number: seat.number,
                type: seat.type,
                isBooked: false
            }))
        }));

        let totalPrice = 0

        // console.log("Incoming seat:", seats);
        // console.log("Seat Layout:", s.seatLayout);

        for(let bookedSeat of seats){
            const rowdata = screenid.seatLayout.find(
                (r)=>r.row===bookedSeat.row
            )
            // console.log(rowdata)
            if (!rowdata) {
                return res.status(400).json({ message: "Invalid row" });
            }
            const seatdata = rowdata.seats.find(
                (se)=>se.number===bookedSeat.number
            )
            if (!seatdata) {
                return res.status(400).json({ message: "Invalid seat" });
            }
            if(seatdata.isBooked){
                return res.status(400).json({ message: `The seat with the ${bookedSeat.row} and ${bookedSeat.number} seat number is already booked !`  });
            }
            totalPrice += s.price[seatdata.type];
        }

        await s.save();

        const b = await booking.create({
            user: userId,
            show: showId,
            totalAmount: totalPrice,
            bookedSeats: seats
        })

        // s.bookedSeats.push(...seats.map(s => s.seat))

        await b.save();

        return res.status(201).json({
                message: "Booking successful",
                booking: b
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}


exports.getBookingById = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingbooking = await booking.findById(id).populate("user show")

        if(!existingbooking){
            return res.status(409).json({
                message: "Booking not done."
            })
        }

        return res.status(200).json({Booking: existingbooking})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBookingByShowId = async function(req,res){
    try {
        const { showid } = req.params

        if(!showid){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingbooking = await booking.findOne({
            show: showid
        }).populate("user")

        if(!existingbooking){
            return res.status(409).json({
                message: "Booking not done"
            })
        }

        return res.status(200).json({Booking: existingbooking})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBookingByUser = async function(req,res){
    try {
        const { userid } = req.params

        if(!userid){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingbooking = await booking.findOne({
            user: userid
        }).populate("show")

        if(!existingbooking){
            return res.status(409).json({
                message: "Booking not done."
            })
        }

        return res.status(200).json({Booking: existingbooking})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.cancelBooking = async function(req,res){
    try {
        const { bookingid } = req.params

        if(!bookingid){
            return res.status(400).json({Status: "Booking id not mentioned"})
        }

        const book = await booking.findById(bookingid)

        if (!book) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const s = await show.findById(book.show)

        if (!s) {
            return res.status(404).json({ message: "Show not found" });
        }

        const screenid = await screen.findById(s.screenId)

        if (!screenid) {
            return res.status(404).json({ message: "Screen not found" });
        }

        if (!book) {
            return res.status(404).json({
                message: "Booking not found"
            })
        }

        //console.log(book.seats)

        //remove booked seats
        book.bookedSeats.forEach((bookedSeat) => {

            const rowData = screenid.seatLayout.find(
                (r) => r.row === bookedSeat.row
            );

            if (!rowData) return;

            const seat = rowData.seats.find(
                (s) => s.number === bookedSeat.number
            );

            if (!seat) return;

            seat.isBooked = false; // 🔥 UNLOCK SEAT
        });

        await s.save()

        book.bookingStatus = "cancelled";
        book.paymentStatus = "failed";

        await book.save()

        await book.deleteOne()

        // console.log(m)

        return res.status(200).json({Status: "Booking Canceled successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAllBookings = async (req, res) => {
    try {
        const book = await booking.find()

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: book
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}