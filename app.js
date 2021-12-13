require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');


const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.set('view engine', 'ejs');
server.use(express.static(__dirname + '/public'))

const { getUnsplashPhoto } = require("./services");
const { application } = require('express');
const MongoDB_URL = `mongodb+srv://${process.env.MDB_USER}:${process.env.MDB_PW}@cluster0.nhbd7.mongodb.net/Gift-List-Application?retryWrites=true&w=majority`;

const client = new MongoClient(MongoDB_URL);

client.connect()
  .then(() => {
    const db = client.db('GiftLists');  //Database Name
    const giftList = db.collection('primary');
    // makeGiftList() ?

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

    // GET/READ
    server.get("/userprofile", async (req, res) => {
      // send proper data from Mongo
      //add creator ID to find/filer unique entries {creator: req.user.id}
      //get will only render the entries related to the specific creator
      const gifts = await giftList.find({creator: userProfile.id}).toArray()
      //  res.send(findResult)
      res.render('index.ejs', {
        gifts: gifts
      })
    });


    // POST/CREATE
    server.post('/userprofile', async (req, res) => {
      // get data values from form: giftName, recipient, link, date
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

      //new gift creator value req.user.id
      newGift.creator = userProfile.id

      // push: add all data to new Gift card
      await giftList.insertOne(newGift)

      res.redirect(303, '/userprofile')
      // res.redirect(req.originalUrl)
      // const gifts = await giftList.find({creator: userProfile.id}).toArray()
      // res.render('index.ejs', {
      //   gifts: gifts
      // })
      // response.redirect(request.get('referer'));
    
    })


    // PUT/UPDATE
    server.put('/userprofile', async (req, res) => {

      // get edit data: _id, giftName, recipient, link, date
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
    server.delete('/userprofile/:id', async (req, res) => {
      // get id to be deleted
      const giftListID = req.params.id;

      // remove the request from the database
      const deleteGift = await giftList.findOneAndDelete({ _id: ObjectId(giftListID) })

      // redirect
      res.redirect(303, "/userprofile")
    })

    //Passport 
    const session = require('express-session');
    const passport = require('passport');
    const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    server.set('view engine', 'ejs');

    server.use(session({
      resave: false,
      saveUninitialized: true,
      secret: 'SECRET'
    }));

    server.get('/', function (req, res) {
      res.render('pages/auth');
    });

    var userProfile;

    server.use(passport.initialize());
    server.use(passport.session());

    server.get('/success', (req, res) => res.send({user: req.user}));
    server.get('/error', (req, res) => res.send("error logging in"));

    passport.serializeUser(function (user, cb) {
      cb(null, user);
    });

    passport.deserializeUser(function (obj, cb) {
      cb(null, obj);
    });

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
      function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, userProfile);
      }
    ));

    server.get('/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] }));

    server.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/error' }),
      function (req, res) {
        // Successful authentication, redirect success.
        //res.redirect('/success');
        res.redirect('/userprofile');
      });
  })
