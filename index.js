const express = require("express"),
    morgan = require("morgan"),
    fs = require("fs"),
    path = require("path");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"})

//array of top ten movies
let topMovies = [
    {
        title: "Spaceballs",
        director: "Mel Brooks"
    },
    {
        title: "Rat Race",
        director: "Jerry Zucker"
    },
    {
        title: "Monty Python and the Holy Grail",
        director: [
            "Terry Gillam", "Terry Jones"
        ]
    },
    {
        title: "Tenacious D in The Pick of Destiny",
        director: "Liam Lynch"
    },
    {
        title: "Donnie Darko",
        director: "Richard Kelly"
    },
    {
        title: "Interstellar",
        director: "Christopher Nolan"
    },
    {
        title: "Interstella 5555",
        director: [
            "Leiji Matsumoto", "Kazuhisa Takenouchi", "Hirotoshi Rissen", "Daisuke Nishio"
        ]
    },
    {
        title: "Bill and Ted's Excellent Adventure",
        director: "Stephen Herek"
    },
    {
        title: "This Is Spinal Tap",
        director: "Rob Reiner"
    }
];

app.use(morgan("combined", {stream: accessLogStream}));
app.use("/documentation", express.static("public"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

//GET requests
app.get("/", (req, res) => {
    res.send("Let's check out some movies! Head over to /movies to see my favorites.");
});

app.get("/secreturl", (req, res) => {
    res.send("This is a secret url with super top-secret content.");
})

app.get("/documentation", (req, res) => {
    res.sendFile("public/documentation.html", {root: __dirname});
});

app.get("/movies", (req, res) => {
    res.json(topMovies);
});

//listen for requests
app.listen(8080, () => {
    console.log("Your app is listening on port 8080");
});
