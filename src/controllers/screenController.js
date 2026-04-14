const screen = require("../models/screenModel")
const theatre = require("../models/theatreModel")
const {updatescreenValidation} = require("../validations/movieValidation")

exports.addscreenFunction = async function(req,res){
    try {

        const {theatreId} = req.body

        const theatreExists = await theatre.findById(theatreId);
        if (!theatreExists) {
            return res.status(404).json({ message: "Theatre not found" });
        }

        const existingscreen = await screen.findOne({name: req.body.name, theatreId})

        if (existingscreen) {
            return res.status(404).json({ message: "Screen is already there in the theatre" });
        }


        const m = await screen.create(req.body)

        

        // console.log(m)

        return res.status(201).json({Status: "Screen added successfully !!", Data: m})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removescreenFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const deletedscreen = await screen.findOneAndDelete(id)

        if (!deletedscreen) {
            return res.status(404).json({
                message: "Show not found"
            })
        }

        // console.log(m)

        return res.status(200).json({Status: "Screen deleted successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removeAllScreen= async function(req,res){
    try {
        await screen.deleteMany({})

        return res.status(201).json({Status: "All Screen deleted successfully !!"})
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updatescreenFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const validationResult = await updatescreenValidation.safeParseAsync(req.body)

        if(validationResult.error){
            return res.status(400).json({Error: validationResult.error.format()})
        }

        

        // const {movie,theatre,screen,startTime,price,seatsAvailble} = validationResult.data

        const m = await show.findByIdAndUpdate(id, validationResult.data)

        if (!m) {
            return res.status(404).json({
                message: "Screeen not found"
            })
        }

        return res.status(200).json({Status: "Screen updated successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getscreenById = async function(req,res){
    try {
        const { screenid } = req.params

        if(!screenid){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingscreen = await screen.findOne(id)

        if(!existingscreen){
            return res.status(409).json({
                message: "screen not found."
            })
        }

        return res.status(200).json({Screen: existingscreen})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAllscreen = async function(req,res){
    try {
        const s = await screen.find().populate("theatre")

        return res.status(200).json({
            Total: s.length,
            Screens: s
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getscreenByTheatreId = async function(req,res){
    try {
        const { theatreid } = req.params

        if(!theatreid){
            return res.status(400).json({Status: "theatre id not mentioned"})
        }

        const m = await screen.find({
            theatreId: theatreid,
            isActive: true
        }).populate("theatreId")

        if (!m) {
            return res.status(404).json({
                message: "Screen not found"
            })
        }

        return res.status(200).json({Screen: m})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}



