const movie = require("../models/movieModel")
const {movieValidation,updateMovieValidation} = require("../validations/movieValidation")

exports.addMovieFunction = async function(req,res){
    try {
        const validationResult = await movieValidation.safeParseAsync(req.body)

        if(validationResult.error){
            return res.status(400).json({Error: validationResult.error.format()})
        }

        

        const {title,descrition,duration,releaseDate,genre,language,poster,createdBy} = validationResult.data
        const existingMovie = await movie.findOne({ title })

        if(existingMovie){
            return res.status(409).json({
                message: "Movie already exists"
            })
        }
        const m = await movie.create({
            title,
            descrition,
            duration,
            releaseDate,
            genre,
            language,
            poster,
            createdBy: req.user.id
        })

        // console.log(m)

        return res.status(201).json({Status: "Movie added successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.removeMovieFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const deletedMovie = await movie.findOneAndDelete(id)

        if (!deletedMovie) {
            return res.status(404).json({
                message: "Movie not found"
            })
        }

        // console.log(m)

        return res.status(200).json({Status: "Movie deleted successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateMovieFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const validationResult = await updateMovieValidation.safeParseAsync(req.body)

        if(validationResult.error){
            return res.status(400).json({Error: validationResult.error.format()})
        }

        

        const {title,descrition,duration,releaseDate,genre,language,poster,createdBy} = validationResult.data

        const m = await movie.findByIdAndUpdate(id,{
            title,
            descrition,
            duration,
            releaseDate,
            genre,
            language,
            poster,
            createdBy: req.user.id
        })

        if (!m) {
            return res.status(404).json({
                message: "Movie not found"
            })
        }

        



        // console.log(m)

        return res.status(200).json({Status: "Movie updated successfully !!"})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getMovieFunction = async function(req,res){
    try {
        const { id } = req.params

        if(!id){
            return res.status(400).json({Status: "id not mentioned"})
        }

        const existingMovie = await movie.findOne(id)

        if(!existingMovie){
            return res.status(409).json({
                message: "Movie not found."
            })
        }

        return res.status(200).json({Movie: existingMovie})

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getAllMovies = async function (req, res) {
    try {
        let { page = 1, limit = 10, search, genre, language, sort, status } = req.query

        page = parseInt(page)
        limit = parseInt(limit)

        const query = {}

        // 🔍 Search by title
        if (search) {
            query.title = { $regex: search, $options: "i" }
        }

        // 🎭 Filter by genre
        if (genre) {
            query.genre = genre
        }

        // 🌐 Filter by language
        if (language) {
            query.language = { $regex: language, $options: "i" }
        }

        // 📅 Status filter
        if (status === "upcoming") {
            query.releaseDate = { $gt: new Date() }
        } else if (status === "released") {
            query.releaseDate = { $lte: new Date() }
        }

        // ↕️ Sorting
        let sortOption = {}
        if (sort === "latest") {
            sortOption.releaseDate = -1
        } else if (sort === "oldest") {
            sortOption.releaseDate = 1
        }

        const movies = await movie.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)

        const total = await movie.countDocuments(query)

        return res.status(200).json({
            message: "Movies fetched successfully",
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: movies
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getTrendingMovies = async function (req, res) {
    try {
        const movies = await movie
            .find({ isActive: true })
            .sort({ bookingCount: -1 }) // highest first
            .limit(10)

        return res.status(200).json({
            message: "Trending movies fetched successfully",
            data: movies
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}
