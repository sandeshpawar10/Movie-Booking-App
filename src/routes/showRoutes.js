const express = require("express")
const router = express.Router()
const controller = require("../controllers/showsController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
const {checkAdmin} = require("../middlewares/roleMiddleware")

router.post('/show/add-show',verifyJWt,checkAdmin,controller.addshowsFunction)
router.delete('/show/remove-show/:id',verifyJWt,checkAdmin,controller.removeshowsFunction)
router.delete('/show/delete-Allshows',verifyJWt,checkAdmin,controller.removeAllShows)
router.patch('/show/update-show/:id',verifyJWt,checkAdmin,controller.updateshowFunction)
router.get('/show/all-shows',controller.getAllShows)
router.get('/show/show-by-id/:id',controller.getShowById)
router.get('/show/show-by-theatreId/:theatreid',controller.getShowByTheatreId)
router.get('/show/availbleSeats/:id',controller.getAvailableSeats)
router.get('/show/show-by-city',controller.getShowByCity)
router.get('/show/show-by-movieId/:movieid',controller.getShowByMovieId)

module.exports = router