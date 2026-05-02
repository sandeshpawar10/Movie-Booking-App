const show = require("../models/showModel")
const theatre = require("../models/theatreModel")
const screen = require("../models/screenModel")
const movie = require("../models/movieModel")
const {updateshowValidation} = require("../validations/movieValidation")

exports.addshowsFunction = async function(req,res){
    try {
        const { movieId, screenId, theatreId, startTime, price } = req.body;

        const th = await theatre.findById(theatreId)

        if (!th) {
            return res.status(404).json({ message: "Theatre not found" });
        }

        const m = await movie.findById(movieId);
        if (!m) {
            return res.status(404).json({ message: "Movie not found" });
        }

        const sc = await screen.findById(screenId);
        if (!sc) {
            return res.status(404).json({ message: "Screen not found" });
        }

        const existingShow = await show.findOne({
            screenId: screenId,
            startTime: new Date(startTime)
        });

        if (existingShow) {
            return res.status(400).json({
                message: "Show already exists for this screen at this time"
            });
        }

        // ✅ 4. Create Show (NO seatLayout here)
        const newShow = new show({
            movieId: movieId,
            screenId: screenId,
            theatreId: theatreId,
            startTime,
            price,
            bookedSeats: [] // initially empty
        });

        await newShow.save();

        return res.status(201).json({
            success: true,
            message: "Show created successfully",
            show: newShow
        });

  } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
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

        

        const {movieId,theatreId,screenId,startTime,price,bookedSeats} = validationResult.data

        const m = await show.findByIdAndUpdate(id,{
            movieId,theatreId,screenId,startTime,price,bookedSeats
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

        const existingShow = await show.findById(id).populate("theatreId screenId")

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
        const s = await show.find().populate("movieId theatreId screenId")

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
            movieId: movieid
        }).populate("theatreId screenId")

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
        
        const s = await show.findById(id).populate("screenId")

        if(!s){
            return res.status(404).json({ message: "Show not found" });
        }

        const layout = s.screenId.seatLayout;

        let availableSeats = [];

        for(let row of layout){
            for(let seat of row.seats){
                if(!seat.isBooked){
                    availableSeats.push({
                        row: row.row,
                        number: seat.number,
                        type: seat.type
                    });
                }
            }
        }

        return res.status(200).json({
            availableSeatsCount: availableSeats.length,
            availableSeats
        });
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

        const m = await show.findOne({
            theatreId: theatreid
        }).populate("movieId screenId")

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
            path: "theatreId",
            match: {"location.city": city}
        }).populate("movieId screenId theatreId")

        const f = s.filter(s => s.theatreId !== null)

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

        const s = await show.find({movieId: movieid}).populate("screenId")

        const screens = []
        const seen = new Set()

        for(let sh of s){
            if (!sh.screen) continue;
            const screenid = sh.screen._id.toString()
            if(!seen.has(screenid)){
                seen.add(screenid)
                screens.push(sh.screen)
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