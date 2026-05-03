// One-time script to fix all movies missing posters using OMDB API
require("dotenv").config();
const mongoose = require("mongoose");
const movie = require("./src/models/movieModel");

const OMDB_KEY = process.env.OMDB_API_KEY;

// Map common alternate titles to their OMDB-searchable names
const titleMap = {
    "bahubali 1": "Baahubali: The Beginning",
    "bahubali 2": "Baahubali 2: The Conclusion",
    "kgf 1": "K.G.F: Chapter 1",
    "kgf 2": "K.G.F: Chapter 2",
    "ratsasan": "Ratsasan",
    "race3": "Race 3",
    "kalki": "Kalki 2898 AD",
    "avengers": "Avengers: Endgame",
    "pushpa": "Pushpa: The Rise",
    "pushpa 2": "Pushpa 2: The Rule"
};

async function fixPosters() {
    await mongoose.connect(process.env.mongodburl);
    console.log("Connected to DB");

    const movies = await movie.find({});
    console.log(`Found ${movies.length} movies total\n`);

    for (const m of movies) {
        if (m.poster && m.poster.startsWith("http")) {
            console.log(`✅ ${m.title} — already has poster`);
            continue;
        }

        // Try mapped title first, then original
        const searchTitle = titleMap[m.title.toLowerCase()] || m.title;
        console.log(`🔍 Searching OMDB for: "${searchTitle}" (original: "${m.title}")`);

        try {
            const url = `https://www.omdbapi.com/?t=${encodeURIComponent(searchTitle)}&apikey=${OMDB_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.Response !== "False" && data.Poster && data.Poster !== "N/A") {
                m.poster = data.Poster;
                await m.save();
                console.log(`  ✅ Saved poster: ${data.Poster.substring(0, 60)}...`);
            } else {
                console.log(`  ❌ Not found on OMDB for "${searchTitle}"`);
            }
        } catch (e) {
            console.log(`  ❌ Error: ${e.message}`);
        }
    }

    console.log("\nDone!");
    process.exit(0);
}

fixPosters();
