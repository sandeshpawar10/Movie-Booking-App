const express = require("express")
const router = express.Router()
const controller = require("../controllers/screenController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
const {checkAdmin} = require("../middlewares/roleMiddleware")

router.post('/screen/add-screen',verifyJWt,checkAdmin,controller.addscreenFunction)
router.delete('/screen/remove-screen/:id',verifyJWt,checkAdmin,controller.removescreenFunction)
router.delete('/screen/delete-Allscreen',verifyJWt,checkAdmin,controller.removeAllScreen)
router.patch('/screen/update-screen/:id',verifyJWt,checkAdmin,controller.updatescreenFunction)

router.get('/screen/screen-by-id/:screenid',controller.getscreenById)
router.get('/screen/all-screen',controller.getAllscreen)
router.get('/screen/screen-by-theatreId/:theatreid',controller.getscreenByTheatreId)



module.exports = router