const express = require("express")
const router = express.Router()
const controller = require("../controllers/paymentController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")

router.post('/payment/create-order',verifyJWt,controller.createOrder)
router.post('/payment/veirfy-payment',verifyJWt,controller.verifyPayment)
router.get('/payment/my-transactions/:userid',verifyJWt,controller.getMyTransactions)

module.exports = router