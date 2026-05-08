const {z} = require("zod")

const movieValidation = z.object({
    title: z.string().nonempty(),
    releaseDate: z.coerce.date({
        required_error: "Release date is required",
        invalid_type_error: "Invalid date format"
    }),
    duration: z.number(),
    language: z.string(),
    descrition: z.string().optional(),
    genre: z.any().optional(),
    poster: z.string().optional(),
    director: z.string().optional(),
    cast: z.array(z.object({
        name: z.string(),
        photo: z.string().optional()
    })).optional()
})

const titleValidation = z.object({
    title: z.string().nonempty(),
})

const updateMovieValidation = z.object({
    title: z.string().min(1).optional(),
    descrition: z.string().optional(),
    duration: z.number().optional(),
    releaseDate: z.coerce.date().optional(),
    genre: z.any().optional(),
    language: z.string().optional(),
    poster: z.string().optional(),
    director: z.string().optional(),
    cast: z.array(z.object({
        name: z.string(),
        photo: z.string().optional()
    })).optional()
})

const updateshowValidation = z.object({
    movie: z.string().optional(),
    theatre: z.string().optional(),
    screen: z.string().optional(),
    startTime: z.date().optional(),
    price: z.object({
        silver: z.number(),
        platinum: z.number(),
        gold: z.number(),
    }).optional(),
    seatsAvailble: z.array().optional()
})

const updatescreenValidation = z.object({
    name: z.string().optional(),
    theatre: z.string().optional(),
    screenNUmber: z.number().optional(),
    totalSeats: z.number().optional(),
    startTime: z.date().optional(),
    seatLayout: z.object({
        row: z.string(),
    }).optional(),
})

module.exports = {movieValidation,titleValidation,updateMovieValidation,updateshowValidation,updatescreenValidation}