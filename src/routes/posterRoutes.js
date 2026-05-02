const express = require("express")
const router = express.Router()

// Search OMDB for a movie poster by title
router.get('/api/poster-search', async (req, res) => {
    try {
        const { title } = req.query
        if (!title) return res.status(400).json({ message: "title query param required" })

        const apiKey = process.env.OMDB_API_KEY
        if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
            return res.status(400).json({ message: "OMDB_API_KEY not set in .env. Get a free key at https://www.omdbapi.com/apikey.aspx" })
        }

        const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`
        const response = await fetch(url)
        const data = await response.json()
        //console.log(data)

        if (data.Response === 'False') {
            return res.status(404).json({ message: data.Error || "Movie not found" })
        }

        return res.status(200).json({
            title: data.Title,
            poster: data.Poster !== 'N/A' ? data.Poster : null,
            year: data.Year,
            genre: data.Genre,
            plot: data.Plot
        })
    } catch (error) {
        return res.status(500).json({ message: "Error fetching from OMDB", error: error.message })
    }
})

module.exports = router
