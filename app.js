require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

// const encrypt = require("mongoose-encryption");
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
//const secret = process.env.SECRET;

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
    res.render("home")
});

app.get("/login", function (req, res) {
    res.render("login")
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    // if (req.isAuthenticated()) {
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
    User.find({ "secret": { $ne: null } })
        .then((userSecret) => {
            console.log("IN GET ROUTE ");
            res.render("secrets", { userWithSecret: userSecret });
            console.log("AFTER RENDERING");
        });
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
    res.redirect("/")
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function (req, res) {
    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     const user = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     user.save();
    //     res.render("secrets");
    // });
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });


});

app.post("/login", function (req, res) {
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({ email: username })
    //     .then((user) => {
    //         bcrypt.compare(password, user.password, function (err, result) {
    //             res.render("secrets");
    //         });
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     });
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })


});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    const ID = req.user.id;
    console.log("ID is here" + ID);
    User.findById(ID)
        .then((user) => {
            user.secret = submittedSecret;
            user.save();
            res.redirect("/secrets");
        })
        .catch((err) => {
            console.log("Im error bitch" + err);
        });
});



app.listen(3000, function () {
    console.log("server running on port 3000.");
});
