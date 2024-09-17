const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/myFlixDB", {useNewUrlParser: true, useUnifiedTopology: true });

const bodyParser = require("body-parser");
const express = require("express"),
    morgan = require("morgan"),
    fs = require("fs"),
    path = require("path"),
    uuid = require("uuid");
const passport = require("passport");
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"})

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
let auth = require('./auth')(app);

app.use(morgan("combined", {stream: accessLogStream}));
app.use("/documentation", express.static("public"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

//CREATE/POST requests
app.post("/users",  (req, res) => {
    Users.findOne({Username: req.body.Username})
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + "already exists")
            } else {
                Users.create({
                    Username: req.body.Username,
                    Password: req.body.Password,
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

app.post("/users/:Username/movies/:MovieID",   (req, res) => {
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
app.delete("/users/:Username/movies/:MovieID",   (req, res) => {
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $pull: {FavoriteMovies: req.params.MovieID},
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

app.delete("/users/:Username",   (req, res) => {
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
app.put("/users/:Username",   (req, res) => {
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

app.get("/secreturl",   (req, res) => {
    res.send("This is a secret url with super top-secret content.");
})

app.get("/documentation",   (req, res) => {
    res.sendFile("public/documentation.html", {root: __dirname});
});

app.get("/movies",   (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/:Title",   (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

app.get("/movies/genre/:Name",   (req, res) => {
    Movies.findOne({"Genre.Name": req.params.Name})
        .then((movie) => {
            res.json(movie.Genre.Description);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/directors/:Name",   (req, res) => {
    Movies.findOne({"Director.Name": req.params.Name})
        .then((movie) => {
            res.json(movie.Director.Bio);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/users",   (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/users/:Username",   (req, res) => {
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
app.listen(8080, () => {
    console.log("Your app is listening on port 8080");
});
