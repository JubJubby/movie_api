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

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"})

app.use(bodyParser.json());

//array of users
let users = [
    {
        id: 1,
        name: "Dan",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "Natalie",
        favoriteMovies: ["Spaceballs"]
    },
]

//array of ten movies
let movies = [
    {
        Title: "Spaceballs",
        Director: "Mel Brooks",
        Genre: "Comedy"
    },
    {
        Title: "Rat Race",
        Director: "Jerry Zucker",
        Genre: "Comedy"
    },
    {
        Title: "Monty Python and the Holy Grail",
        Director: "Terry Gilliam",
        Genre: "Comedy"
    },
    {
        Title: "Tenacious D in The Pick of Destiny",
        Director: "Liam Lynch",
        Genre: "Comedy"
    },
    {
        Title: "Donnie Darko",
        Director: "Richard Kelly",
        Genre: "Horror"
    },
    {
        Title: "Interstellar",
        Director: "Christopher Nolan",
        Genre: "Science Fiction"
    },
    {
        Title: "Interstella 5555",
        Director: "Kazuhisa Takenouchi",
        Genre: "Anime"
    },
    {
        Title: "Bill and Ted's Excellent Adventure",
        Director: "Stephen Herek",
        Genre: "Action"
    },
    {
        Title: "This Is Spinal Tap",
        Director: "Rob Reiner",
        Genre: "Comedy"
    },
    {
        Title: "Oppenheimer",
        Director: "Christopher Nolan",
        Genre: "Thriller"
    }
];

app.use(morgan("combined", {stream: accessLogStream}));
app.use("/documentation", express.static("public"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

//CREATE/POST requests
app.post("/users", (req, res) => {
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

app.post("/users/:id/:movieTitle", (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
    } else {
        res.status(400).send("no such user")
    }
})

//DELETE requests
app.delete("/users/:id/:movieTitle", (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(400).send("no such user")
    }
})

app.delete("/users/:Username", (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
        .then((user) => {
            if(!user) => {
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
app.put("/users/:Username", (req, res) => {
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

app.get("/secreturl", (req, res) => {
    res.send("This is a secret url with super top-secret content.");
})

app.get("/documentation", (req, res) => {
    res.sendFile("public/documentation.html", {root: __dirname});
});

app.get("/movies", (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/:title", (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
    });
});

app.get("/movies/genre/:Name", (req, res) => {
    Genres.findOne({Name: req.params.Name})
        .then((genre) => {
            req.json(genre.Description);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get("/movies/directors/:Name", (req, res) => {
    Directors.findOne({Name: req.params.Name})
        .then((director) => {
            res.json(director);
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
