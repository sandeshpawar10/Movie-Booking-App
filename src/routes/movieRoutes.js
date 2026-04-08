const express = require("express")
const router = express.Router()
const controller = require("../controllers/movieControllers")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
const {checkAdmin} = require("../middlewares/roleMiddleware")


router.post('/addmovie',verifyJWt,checkAdmin,controller.addMovieFunction)
router.delete('/delete-movie/:id',verifyJWt,checkAdmin,controller.removeMovieFunction)
router.patch('/update-movie/:id',verifyJWt,checkAdmin,controller.updateMovieFunction)
router.get('/get-movie/:id',controller.getMovieFunction)
router.get('/movies',controller.getAllMovies)
router.get('/movies',controller.getTrendingMovies)

module.exports = router