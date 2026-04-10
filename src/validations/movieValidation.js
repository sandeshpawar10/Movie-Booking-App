const {z} = require("zod")

const movieValidation = z.object({
    title: z.string().nonempty(),
    releaseDate: z.coerce.date({
        required_error: "Release date is required",
        invalid_type_error: "Invalid date format"
    }),
    duration: z.number(),
    language: z.string(),

})

const titleValidation = z.object({
    title: z.string().nonempty(),
})

const updateMovieValidation = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    duration: z.number().optional(),
    releaseDate: z.date().optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    poster: z.string().optional()
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

module.exports = {movieValidation,titleValidation,updateMovieValidation}