const jwtSecret = "your_jwt_secret"; //same key as the one used in JWTStrategy

const jwt = require("jsonwebtoken"),
    passport = require("passport");

require("./passport"); //the local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //encoded username in the JWT
        expiresIn: "7d", //the token has a seven day expiration date
        algorithm: "HS256" //algorithm used to "sign" or encode the values of the JWT
    });
}

//POST login
module.exports = (router) => {
    router.post("/login", (req, res) => {
        passport.authenticate("local", {session: false}, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: "Something is not right",
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({user, token});
            });
        })(req, res);
    });
}