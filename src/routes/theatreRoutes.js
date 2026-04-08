const express = require("express")
const router = express.Router()
const controller = require("../controllers/theatreController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
const {checkAdmin} = require("../middlewares/roleMiddleware")

router.post('/theatre/add', verifyJWt, checkAdmin, controller.addtheatreFunction)
router.post('/theatre/remove', verifyJWt, checkAdmin, controller.removetheatreFunction)
router.post('/theatre/update', verifyJWt, checkAdmin, controller.updatetheatreFunction)
router.get('/theatre/all-theatre',controller.getAllTheatres)

module.exports = router