const show = require("../models/showModel")
const theatre = require("../models/theatreModel")
const {updateshowValidation} = require("../validations/movieValidation")

exports.addshowsFunction = async function(req,res){
    try {
        
        const {theatre} = req.body

        const theatreExists = await theatre.findById(theatre);
        if (!theatreExists) {
            return res.status(404).json({ message: "Theatre not found" });
        }

        const m = await show.create(req.body)

        // console.log(m)

        return res.status(201).json({Status: "Show added successfully !!", Data: m})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removeAllShows = async function(req,res){
    try {
        await show.deleteMany({})

        return res.status(201).json({Status: "All Shows deleted successfully !!"})
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removeshowsFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const deletedshow = await show.findOneAndDelete(id)

        if (!deletedshow) {
            return res.status(404).json({
                message: "Show not found"
            })
        }

        // console.log(m)

        return res.status(200).json({Status: "Show deleted successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateshowFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const validationResult = await updateshowValidation.safeParseAsync(req.body)

        if(validationResult.error){
            return res.status(400).json({Error: validationResult.error.format()})
        }

        

        const {movie,theatre,screen,startTime,price,seatsAvailble} = validationResult.data

        const m = await show.findByIdAndUpdate(id,{
            movie,theatre,screen,startTime,price,seatsAvailble
        })

        if (!m) {
            return res.status(404).json({
                message: "Show not found"
            })
        }

        return res.status(200).json({Status: "Show updated successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getShowById = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingShow = await show.findOne(id)

        if(!existingShow){
            return res.status(409).json({
                message: "Show not found."
            })
        }

        return res.status(200).json({Show: existingShow})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAllShows = async function(req,res){
    try {
        const s = await show.find().populate("movie theatre screen")

        return res.status(200).json({
            Total: s.length,
            Shows: s
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getShowByMovieId = async function(req,res){
    try {
        const { movieid } = req.params

        if(!movieid){
            return res.status(400).json({Status: "movieid not mentioned"})
        }

        const m = await show.find({
            movie: movieid
        }).populate("theatre screen")

        if (!m) {
            return res.status(404).json({
                message: "Show not found"
            })
        }

        return res.status(200).json({Show: m})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAvailableSeats = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }
        
        const s = await show.findById(id)

        return res.status(200).json({
            seatsAvailble: s.seatsAvailble
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getShowByTheatreId = async function(req,res){
    try {
        const { theatreid } = req.params

        if(!theatreid){
            return res.status(400).json({Status: "theatre id not mentioned"})
        }

        const m = await show.find({
            theatre: theatreid
        }).populate("movie screen")

        if (!m) {
            return res.status(404).json({
                message: "Show not found"
            })
        }

        return res.status(200).json({Show: m})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getShowByCity = async function(req,res){
    try {
        const { city } = req.query

        if (!city) {
            return res.status(400).json({
                message: "City is required"
            });
        }

        const s = await show.find().populate({
            path: "theatre",
            match: {"location.city": city}
        }).populate("movie screen")

        const f = s.filter(s => s.theatre !== null)

        return res.status(200).json({
            Total: f.length,
            shows: f
            
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.getScreenByMovie = async function(req,res){
    try {
        const {movieid} = req.params

        const s = await show.find({movie: movieid}).populate("theatre screen")

        const screens = []
        const seen = new Set()

        for(let sh of s){
            const screenid = sh.screen._id.toString()
            if(!seen.has(screenid)){
                seen.add(screenid)
                screens.push(show.screen)
            }
        }

        return res.status(200).json({
            total: screens.length,
            Screens: screens
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}