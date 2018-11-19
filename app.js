require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const flash = require('connect-flash');
const app = express();
const auth = require('./routes/auth');
const User = require('./models/user.js');

mongoose
  .connect('mongodb://localhost/careyourpet', { useNewUrlParser: true })
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });


const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);
const index = require('./routes/index');

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// default value for title local
app.locals.title = 'Care Your Pet';


// Passport GOOGLE
passport.use(
  new GoogleStrategy(
    {
      clientID:
        '207886205081-09rdttg7cppmsat3t2a9qb4h4qs40abh.apps.googleusercontent.com',
      clientSecret: 'LIynABNI-MbwhPe9ivp0grGk',
      callbackURL: '/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ googleID: profile.id }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          googleID: profile.id
        });

        newUser.save().then((user) => {
          done(null, newUser);
        });
      });
    }
  )
);

// Passport Facebook
// passport.use(new FacebookStrategy({
//   clientID: FACEBOOK_APP_ID,
//   clientSecret: FACEBOOK_APP_SECRET,
//   callbackURL: "http://www.example.com/auth/facebook/callback"
// },
// function(accessToken, refreshToken, profile, done) {
//   User.findOrCreate(..., function(err, user) {
//     if (err) { return done(err); }
//     done(null, user);
//   });
// }
// ));




app.use(passport.initialize());
app.use(passport.session());

// app.use('/', authRoutes);
app.use('/', index);
app.use('/', auth);


module.exports = app;
