//Create some constants to require packages/modules

/*
It is important to put (require("dotenv").config();) on the top otherwise
you may not be able to access it if it is not configured
*/
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require("passport")
//We don't need to require passport-local because it's one
// of those dependencies that will be needed by passport-local-mongoose
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const FacebookStrategy = require('passport-facebook').Strategy;

//Create a new app instance using express
const app = express()


//Tell the app to use all the statics files inside the public folder
app.use(express.static("public"));

//Tell the app to use EJS as its view engine as the templating engine
app.set('view engine', 'ejs')


//Require body-parser module to parser the requests
app.use(bodyParser.urlencoded({
  extended: true
}));

//Set up express session
app.use(session({
  //js object with a number of properties (secret, resave, saveUninitialized)
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

//Initialize and start using passport.js
app.use(passport.initialize());
app.use(passport.session());

//Connect to mongoDB
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});


/*Use a userSchema object created from the mongoose.Schema class*/
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

/*
In order to set up the passport-local-mongoose, it needs to be added to
the mongoose schema as a plugin
That is what we will use now to hash and salt the passwords
and to save the users into the mongoDB database
*/
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

/////No need for userSchema encrypt since we use md5 Hash MAP now //////
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

//Setup a new User model and specify the name of the collection User
const User = new mongoose.model("User", userSchema);

/*
passport-local Configuration
Create a strategy which is going to be the local strategy to
authenticate users using their username and password and also to
serialize and deserialize the user
Serialize the user is to basically create the cookie and add inside the
message, namely the user's identification into the cookie
Deserialize the user is to basically allow passport to be able to crumble
the cookie and discover the message inside which is who the user is all of the user's
identification so that we can authenticate the user on the server
*/
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3300/auth/google/secrets",
    passReqToCallback: true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return done(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3300/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


//Add some GETs to view the EJS files/websites
//Target the home/root route to render the home page
app.get("/", (req, res) => {
  res.render("home");
});

//Target the google route to render the authentication page
app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

//Target the facebook route to render the authentication page
app.get('/auth/facebook',
  passport.authenticate('facebook', {
    scope: ['profile', "email"]
  })
);

//Target the google route to render the redirect page
app.get("/auth/google/secrets",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

//Target the facebook route to render the redirect page
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//Target the login route to render the login page
app.get("/login", (req, res) => {
  res.render("login");
});

//Target the register route to render the register page
app.get("/register", (req, res) => {
  res.render("register");
});


//Target the secrets route
app.get("/secrets", (req, res) => {
  // The below line was added so we can't display the "/secrets" page
  // after we logged out using the "back" button of the browser, which
  // would normally display the browser cache and thus expose the
  // "/secrets" page we want to protect. Code taken from this post.
  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );

  /*
 Check if the user is authenticated and this is where we are relying on
 passport.js, session, passport-local and passport-local-mongoose to make sure
 that if the user is already logged in then we should simply render the secrets page
 but if the user is not logged in then we are going to redirect the user to the login page
 */

  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//Target the submit route
app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

//POST request (submit route) to post the secrets to secret page
app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});

//Target the logout route
app.get("/logout", function(req, res) {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});


//POST request (register route) to post the username and password the user enter when registering
app.post("/register", (req, res) => {
  //  Now we will incorporate hashing and salting and authentication using passport.js and the packages just added (passport passport-local passport-local-mongoose express-session)

  /*
  Tap into the User model and call the register method, this method comes from
  passport-local-mongoose package which will act as a middle-man to create and save the new user
  and to interact with mongoose directly
  js object -> {username: req.body.username}
  */
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      //Redirect the user back to the register page if there are any error
      res.redirect("/register");
    } else {
      /*
     Authentica the user using passport if there are no errors
     the callback (function()) below is only triggered if the authentication
     is successfull and we managed to successfully setup a cookie that saved
     their current logged in session
     */
      passport.authenticate("local")(req, res, function() {
        /*
       As we are authenticating the user and setting up a logged in session for him
       then the user can go directly to the secret page, they should automatically
       be able to view it if they are still logged in - so now we need to create a secrets route
       */
        res.redirect("/secrets");
      });
    }
  });


});



//POST request (login route) to login the user

/* passport.authenticate("local")
Course code was allowing the user to enter the right username (email) and wrong password
and go to the secrets page by typing in http://localhost:3000/secrets in the browser after getting the Unauthorized page message,
now the addition of passport.authenticate("local")to the app.post... route fixes this issue
*/
app.post("/login",
  passport.authenticate("local"),
  function(req, res) {

    //Now we will incorporate hashing and salting and authentication using passport.js and the packages just added (passport passport-local passport-local-mongoose express-session)

    //Create a new user from the mongoose model with its two properties (username, password)
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    //Now use passport to login the user and authenticate him - take the user created from above
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/secrets");
      }
    });
  });

//Set up the server to listen to port 3300
app.listen(3300, () => {
  console.log('Server started on port 3300')
})
