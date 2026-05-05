const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { METHODS } = require("http")
const connectDB = require("./src/db/connection.js")
const userRoute = require("./src/routes/userRoutes")
const movieRoute = require("./src/routes/movieRoutes")
const theatreroute = require("./src/routes/theatreRoutes.js")
const showRoutes = require("./src/routes/showRoutes.js")
const screenRoutes = require("./src/routes/screenRoutes.js")
const bookingRoutes = require("./src/routes/bookingRoutes.js")
const paymentRoutes = require("./src/routes/paymentRoutes.js")
const posterRoutes = require("./src/routes/posterRoutes.js")
const adminRoutes = require("./src/routes/adminRoutes.js")
const cookieParser = require("cookie-parser")
dotenv.config({
    path:"./.env"
})
const app = express()
const port = process.env.PORT || 8000

connectDB(process.env.mongodburl)

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

//this parts tells which frontend or server can access my backend
app.use(cors({
    origin: true,
    credentials: true,
    METHODS:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowheaders: ["Content-Type","Authorization"]
}))

app.use('/',userRoute)
app.use('/',movieRoute)
app.use('/',theatreroute)
app.use('/',showRoutes)
app.use('/',screenRoutes)
app.use('/',bookingRoutes)
app.use('/',paymentRoutes)
app.use('/',posterRoutes)
app.use('/',adminRoutes)

// Initialize Cron Jobs
require('./src/jobs/reminderJob.js');

app.listen(port,()=>{
    console.log(`server started on port ${port}`)
})