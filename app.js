require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');

//Passport 
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.set('view engine', 'ejs');
server.use(express.static(__dirname + '/public'))

const { getUnsplashPhoto } = require("./public/javascripts/services");
// const { application } = require('express');
const MongoDB_URL = `mongodb+srv://${process.env.MDB_USER}:${process.env.MDB_PW}@cluster0.nhbd7.mongodb.net/Gift-List-Application?retryWrites=true&w=majority`;
const client = new MongoClient(MongoDB_URL);

//Passport 
server.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET'
}));
server.use(passport.initialize());
server.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //callbackURL: "http://localhost:3000/auth/google/callback"
  callbackURL: "https://giftlist-sde-api.herokuapp.com/auth/google/callback",
  passReqToCallback: true
},
  function (req, accessToken, refreshToken, profile, done) {
    return done(null, profile);

  }
));



client.connect()
  .then(() => {
    const db = client.db('GiftLists');
    const giftList = db.collection('primary');

    let PORT = process.env.PORT || 3000;
    server.listen(PORT);
    console.log(`listening to port: ${PORT}`);

    // GET/READ - render homepage
    server.get("/", (req, res) => {
      res.render('homepage.ejs')
    });

    // GET/READ - render log in page
    server.get("/login.ejs", (req, res) => {
      res.render('login.ejs')
    });

    // GET/READ - render contact page
    server.get("/contact", (req, res) => {
      res.render('contact.ejs')
    });
    // GET/READ
    server.get("/userprofile", isLoggedIn, async (req, res) => {
      // send proper data from Mongo
      const gifts = await giftList.find({ creator: req.user.id }).toArray()
      const name = req.user.name.givenName
      res.render('profile.ejs', {
        gifts: gifts,
        name: name
      })
    });


    // POST/CREATE
    server.post('/userprofile', isLoggedIn, async (req, res) => {
      // get data values from form
      const { giftName, recipient, link, date } = req.body

      // VALIDATION: ensure all fields are valid
      if (
        giftName === undefined ||
        giftName.length === 0 ||
        recipient === undefined ||
        recipient.length === 0 ||
        link === undefined ||
        link.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Gift name, recipient, and link are required" });
      }

      const newGift = { giftName, recipient, link };

      // get a photo
      newGift.photo = await getUnsplashPhoto(giftName);

      if (date && date.length !== 0) {
        newGift.date = date;
      }

      // new gift creator value req.user.id
      newGift.creator = req.user.id

      await giftList.insertOne(newGift)

      res.redirect(303, '/userprofile')
    })


    // PUT/UPDATE
    server.put('/userprofile', isLoggedIn, async (req, res) => {

      // get edit data
      const { _id, giftName, recipient, link, date } = req.body

      // validate required data
      if (_id === undefined) {
        return res.status(400).json({ message: "id is required" })
      }
      if (giftName === undefined || giftName.length === 0) {
        return res.status(400).json({ message: "Gift name can't be empty" });
      }
      if (recipient === undefined || recipient.length === 0) {
        return res.status(400).json({ message: "Recipient can't be empty" });
      }
      if (link === undefined || link.length === 0) {
        return res.status(400).json({ message: "Link can't be empty" });
      }

      //assign new values
      const newGift = {
        giftName, recipient, link, photo: await getUnsplashPhoto({ giftName })
      }

      if (date !== undefined) {
        newGift.date = date;
      }

      // update database with new data
      await giftList.findOneAndUpdate({ _id: ObjectId(_id) }, { $set: newGift })

      // send back new data to frontend
      return res.json(newGift)
    })

    // DELETE
    server.delete('/userprofile/:id', isLoggedIn, async (req, res) => {
      // get id to be deleted
      const giftListID = req.params.id;

      // remove the request from the database
      await giftList.findOneAndDelete({ _id: ObjectId(giftListID) })

      // redirect
      res.redirect(303, "/userprofile")
    })


    server.get('/', function (req, res) {
      res.render('pages/auth');
    });

    server.get('/error', (req, res) => res.send("error logging in"));

    server.get('/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] }));

    server.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/error', successRedirect: "/userprofile" }))

    server.get('/logout', function (req, res) {
      req.session.destroy(function (e) {
        req.logout();
        res.redirect('/');
      });
    });

    function isLoggedIn(req, res, next) {
      if (req.isAuthenticated()) {
        next()
      }
      else {
        // re-direct to login page if false
        res.redirect("/login.ejs")
      }
    }
  })