const theatre = require("../models/theatreModel")

exports.addtheatreFunction = async function(req,res){
    try {
        
        const {name,city,address} = req.body
        if(!(name||city||address)){
            return res.status(409).json({
                message: "Please enter valid details !"
            })
        }

        const m = await theatre.create({
            name,
            location:{
                city,
                address
            }
        })

        // console.log(m)

        return res.status(201).json({Status: "Theatre added successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removetheatreFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const deletedtheatre = await theatre.findOneAndDelete(id)

        if (!deletedtheatre) {
            return res.status(404).json({
                message: "Theatre not found"
            })
        }

        // console.log(m)

        return res.status(200).json({Status: "Theatre deleted successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updatetheatreFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const {name,city,address} = req.body

        const m = await theatre.findByIdAndUpdate(id,{
            name,
            location:{
                city,
                address
            }
        })

        if (!m) {
            return res.status(404).json({
                message: "Theatre not found"
            })
        }

        return res.status(200).json({Status: "Movie updated successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAllTheatres = async (req, res) => {
    try {
        const theatres = await theatre.find({ isActive: true })

        return res.status(200).json({
            message: "Theatres fetched successfully",
            count: theatres.length,
            data: theatres
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getTheatreById = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingTheatre = await movie.findOne(id)

        if(!existingTheatre){
            return res.status(409).json({
                message: "Theatre not found."
            })
        }

        return res.status(200).json({Theatre: existingTheatre})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}