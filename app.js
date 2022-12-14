//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
//const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

app.set('view engine', 'ejs'); // set the view engine to ejs

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
})); //to use express-session

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1/userDB', function () {
    console.log('Success')
});



const userschema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userschema.plugin(passportLocalMongoose) //use to hash and salt password

// userschema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ['password']
// }); // for encrytpion of password for mongoose encryption

const User = new mongoose.model('User', userschema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', function (req, res) {
    res.render('home');
});

app.route('/login')
    .get(function (req, res) {
        res.render('login');
    })
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secrets');
                })
            }
        })
    });

app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secrets');
                })
            }
        })
    });

app.get('/secrets', function (req, res) {
    return User.find({
        'secret': {
            $ne: null
        }
    }, function (err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            res.render('secrets', {
                usersWithSecrets: foundUsers
            })
        }
    });
});


app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.route('/submit')
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render('submit')
        } else {
            res.redirect('/login');
        }
    })
    .post(function (req, res) {
        const submitSecret = req.body.secret;
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    foundUser.secret = submitSecret;
                    foundUser.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect('secrets');
                        }
                    });
                }
            }
        });
    });









app.listen(3000, function () {
    console.log('Success on port 3000');
});