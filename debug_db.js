const mongoose = require("mongoose");
require("dotenv").config();
const show = require("./src/models/showModel");
const movie = require("./src/models/movieModel");
const screen = require("./src/models/screenModel");
const booking = require("./src/models/bookingModel");

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL || "mongodb+srv://sandesh2921:Sandesh123@cluster0.db8y6.mongodb.net/movie-booking-system?retryWrites=true&w=majority&appName=Cluster0");
        
        console.log("--- MOVIES ---");
        const movies = await movie.find({});
        console.log(JSON.stringify(movies, null, 2));

        console.log("\n--- SHOWS ---");
        const shows = await show.find({});
        console.log(JSON.stringify(shows, null, 2));

        console.log("\n--- SCREENS ---");
        const screens = await screen.find({});
        console.log(JSON.stringify(screens).substring(0, 500) + "...");
        
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
