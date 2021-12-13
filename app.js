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

    // GET/READ
    server.get("/userprofile", async (req, res) => {
      // send proper data from Mongo
      const gifts = await giftList.find({}).toArray()
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

      // push: add all data to new Gift card
      giftList.insertOne(newGift)
      // redirect
      // res.redirect(303, "/userprofile")
      res.render('index.ejs', {
        gifts: giftList
      })
    })


    // PUT/UPDATE
    server.put('/userprofile', async (req, res) => {
      
      // get edit data: _id, giftName, recipient, link, date
      const { _id, giftName, recipient, link, date } = req.body  

      // validate required data
      if (_id === undefined) {
        return res.status(400).json({ message: "id is required" })
      }

      if (giftName === undefined || giftName.length === 0 ) {
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
  })


// // Auth0 work
// const express = require('express');
// const app = express();
// var session = require('express-session');

// // CONFIG EXPRESS-SESSION
// var sess = {
//   secret: 'not so random',
//   cookie: {},
//   resave: false,
//   saveUninitialized: false
// };

// if (app.get('env') === 'production') {
//   // Use secure cookies in production (requires SSL/TLS)
//   sess.cookie.secure = true;

//   // Uncomment the line below if your application is behind a proxy (like on Heroku)
//   // or if you're encountering the error message:
//   // "Unable to verify authorization request state"
//   // app.set('trust proxy', 1);
// }

// app.use(session(sess));


// // CONFIG PASSPORT TO USE AUTH0
// // Load environment variables from .env
// var dotenv = require('dotenv');
// dotenv.config();

// // Load Passport
// var passport = require('passport');
// var Auth0Strategy = require('passport-auth0');

// // Configure Passport to use Auth0
// var strategy = new Auth0Strategy(
//   {
//     domain: process.env.AUTH0_DOMAIN,
//     clientID: process.env.AUTH0_CLIENT_ID,
//     clientSecret: process.env.AUTH0_CLIENT_SECRET,
//     callbackURL:
//       process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/userprofile'
//   },
//   function (accessToken, refreshToken, extraParams, profile, done) {
//     // accessToken is the token to call Auth0 API (not needed in the most cases)
//     // extraParams.id_token has the JSON Web Token
//     // profile has all the information from the user
//     return done(null, profile);
//   }
// );

// passport.use(strategy);

// app.use(passport.initialize());
// app.use(passport.session());
// app.use(session(sess));