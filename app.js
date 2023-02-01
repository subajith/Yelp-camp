const express = require('express')
const path = require('path')
const ejsMate = require('ejs-mate')
// const joi = require('joi')
const { campgroundSchema } = require('./schemas.js')
const catchAsync = require("./utils/catchAsync")
const ExpressError = require("./utils/ExpressError")
const mongoose = require('mongoose')
const methodOverride = require('method-override');

const campground = require('./models/campground');
const req = require('express/lib/request');
const res = require('express/lib/response');
const { DESTRUCTION } = require('dns')
// const { error } = require('console')


// const connection_string = process.env.CONNECTION_STRING
// mongoose.connect(connection_string, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true
// })
//     .then(() => console.log('MongoDB connection established.'))
//     .catch((error) => console.error("MongoDB connection failed:", error.message))
// mongoose.connect('mongodb://localhost:27017/yelp-camp', {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true
// });

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", () => {
//     console.log("Database connected");
// });


mongoose.connect('mongodb://localhost:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database connected")
    })
    .catch(err => {
        console.log("MONGO OH NO ERROR!!!!")
        console.log(err)
    })


const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'view'))
app.use(express.urlencoded({ extended: true }))

// app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/Campground', catchAsync(async (req, res) => {
    const Campground = await campground.find({})
    res.render('campgrounds/index', { Campground })
}))

app.get('/Campground/new', (req, res) => {
    res.render('campgrounds/new')
})

app.post('/Campground', validateCampground, catchAsync(async (req, res, next) => {
    // if (!req.body.Campground) throw new ExpressError('Invalid Data', 400)

    const Campground = new campground(req.body.campground)
    await Campground.save()
    res.redirect(`/Campground/${Campground._id}`)
}))

app.get('/Campground/:id', catchAsync(async (req, res) => {
    const Campground = await campground.findById(req.params.id)
    res.render('campgrounds/show', { Campground })
}))

app.get('/Campground/:id/edit', catchAsync(async (req, res) => {
    const Campground = await campground.findById(req.params.id)
    res.render('campgrounds/edit', { Campground })
}))

// app.get('/makecampground', async (req, res) => {
//     const camp = new campground({ title: 'My Backyard', description: 'cheap capmping' })
//     await camp.save()
//     res.send(camp)
// })
app.put('/Campground/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params
    const Campground = await campground.findByIdAndUpdate(id, { ...req.body.campground })
    res.redirect(`/Campground/${Campground._id}`)
}))

app.delete('/Campground/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    await campground.findByIdAndDelete(id)
    res.redirect('/Campground')
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})


// app.use((err, req, res, next) => {
//     const { statusCode = 500, message = 'Something went Wrong' } = err;
//     res.status(statusCode).render(message)
// })
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port')
})