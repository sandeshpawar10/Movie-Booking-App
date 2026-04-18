const express = require("express")
const router = express.Router()
const controller = require("../controllers/bookingController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
const {checkAdmin} = require("../middlewares/roleMiddleware")

router.post('/booking/create-booking',verifyJWt,controller.createBooking)
router.delete('/booking/cancel-booking/:bookingid',verifyJWt,controller.cancelBooking)
router.get('/booking/booking-by-id/:id',verifyJWt,controller.getBookingById)
router.get('/booking/booking-by-show/:showid',verifyJWt,checkAdmin,controller.getBookingByShowId)
router.get('/booking/all-bookings',verifyJWt,checkAdmin,controller.getAllBookings)
router.get('/booking/my-bookings/:userid',verifyJWt,controller.getBookingByUser)


module.exports = router