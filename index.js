const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect("mongodb://localhost:27017/myFlixDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const bodyParser = require("body-parser");
const express = require("express"),
    morgan = require("morgan"),
    fs = require("fs"),
    path = require("path")
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"})
const cors = require("cors");
const {check, validationResult} = require("express-validator");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let auth = require('./auth')(app);
const passport = require("passport");
require("./passport");
app.use(passport.initialize());

app.use(morgan("combined", {stream: accessLogStream}));
app.use("/documentation", express.static("public"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

//CREATE/POST requests
app.post("/users",
    [
        check("Username", "Username is required").isLength({min: 5}),
        check("Username", "Username contains non-alphanumeric characters - not allowed.").isAlphanumeric(),
        check("Password", "Password is required").not().isEmpty(),
        check("Email", "Email does not appear to be valid").isEmail()
    ],
    (req, res) => {
        let errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({Username: req.body.Username})
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + "already exists")
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send("Error: " + error);
                        });
                }
            })
})

app.post("/users/:Username/movies/:MovieID", passport.authenticate('jwt', { session: false }), (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $push: {FavoriteMovies: req.params.MovieID},
        },
        {new: true}) //makes sure the updated document is returned
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//DELETE requests
app.delete("/users/:id/:movieTitle",   (req, res) => {
    const {id, movieTitle} = req.params;

    let user = Users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(400).send("no such user")
    }
})

app.delete("/users/:Username", passport.authenticate('jwt', { session: false }), (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    Users.findOneAndDelete({Username: req.params.Username})
        .then((user) => {
            if(!user) {
                res.status(400).send(req.params.Username + " was not found");
            } else {
                res.status(200).send(req.params.Username + " was deleted");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//UPDATE/PUT requests
app.put("/users/:Username", passport.authenticate('jwt', { session: false }),
    [
        check("Username", "Username is required").isLength({min: 5}),
        check("Username", "Username contains non-alphanumeric characters - not allowed.").isAlphanumeric(),
        check("Password", "Password is required").not().isEmpty(),
        check("Email", "Email does not appear to be valid").isEmail()
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors:errors.array()});
        }

        if(req.user.Username !== req.params.Username){
            return res.status(400).send('Permission denied');
        }
        Users.findOneAndUpdate(
            {Username: req.params.Username},
            {$set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                }
            },
            {new: true}) //makes sure the updated document is returned
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send("Error: " + err);
            }
        )
});

//READ/GET requests
app.get("/", (req, res) => {
    res.send("Let's check out some movies! Add '/documentation' to the end of the url for more on how to use this app.");
});

app.get("/secreturl", passport.authenticate('jwt', { session: false }), (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    res.send("This is a secret url with super top-secret content.");
})

app.get("/documentation", passport.authenticate('jwt', { session: false }), (req, res) => {
    res.sendFile("public/documentation.html", {root: __dirname});
});

app.get("/movies", passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/:Title", passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

app.get("/movies/genre/:Name", passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({"Genre.Name": req.params.Name})
        .then((movie) => {
            res.json(movie.Genre.Description);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/directors/:Name", passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({"Director.Name": req.params.Name})
        .then((movie) => {
            res.json(movie.Director.Bio);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/users", passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/users/:Username", passport.authenticate('jwt', { session: false }), (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    Users.findOne({Username: req.params.Username})
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//listen for requests
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0",() => {
    console.log("Your app is listening on port " + port);
});
