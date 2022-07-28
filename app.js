////Step 1 :- Set Up the EJS file i.e home.ejs, login.ejs, register.ejs etc ////////
////Step 2 :- Set up npm init -y in hyper command line ////////
////Step 3 :- Install dependencies npm i body-Parser ejs express mongoose ////////
/////Step 4 :- Create app.js with touch app.js, and open with atom  ////////
/////Step 5 :- Require express, bodyParser, ejs, mongoose in app.js.  ////////
/////Step 6 :-Create our server on port 3300 and make our app.listen  ////////
////Step 7 :- create const variable app and assign express to it  ////////
/////Step 8 :- assign express.static("public") to app.use so it render static pages like login.ejs ////
////Step 9 :- assign view engine, ejs to app.set so our enigine use ejs template ////////
/////Step 10 :- assign bodyParser.urlencoded to app.use so our app encode our URL  ////////
///////Step 11 :- render our pages to their route i.e app.get("/", (req, res) => {res.render("home")})  ////////
///////Step 12 :- Start our 3300 server in command line with nodemon app.js  ////////
///////Step 13 :- Set up Mongoose Database i.e mongoose.connect and start the database with mongod in command terminal  ////////
///////Step 14 :- create const userSchema so  ////////
///////Step 15 :- set up user model for mongoose i.e const User = new mongoose.model ////////
///////Step 16 :- Catch user email and password with app.post("/register")////////
///////Step 16a :- also render the secrets.ejs page only if there isn't an error with the register page////////
///////Step 17 :- Open Studio 3t desktop app (mongoose app), start a connection and check user database for the user email and password ////////
///////Step 18 :- Set up Login post so that if the user data is found in database, the secret page is rendered i.e app.post("/login")///////

///////STEP 2: ENCRYPT THE USER PASSWORD USING MONGOOSE ENCRYPTION////////

///////Step 1 :- Install mongoose-encryption in command line using npm////////
///////Step 2 :- Require mongoose encryption////////
///////Step 3 :- Modify the existing userSchema, Create an object from the mongoose schema class////////
///////Step 4 :- Encrypt your user password using the secret methods,
/////// create const secret, assign secret in string type to it////////
///////Step 5 :- Specify the field you want to encrypt i.e password only////////

///////STEP 3: HIDE YOUR FILES USING GITIGNORE, SECRETS TO ENVIRONMENT VARIABLE////////

///////Step 1 :- Install env using npm i and require it in atom////////
///////Step 2 :- Save SECRETS OF ENCRYPTION to env file ////////
///////Step 3 :- add gitignore files so important files is not pushed gitHub ////////

///////STEP 4: HASH YOUR PASSWORD USING THE HASHING CIPHER METHODS////////

///////Step 1 :- Install md5 using npm i and require it in atom////////
///////Step 2 :- hash the register password on app.post(/register) with md5(req.body.password) ////////
///////Step 3 :-  hash the login password on app.post(/login) with md5(req.body.password)////////

///////STEP 5: HASH and SALT YOUR PASSWORD USING BCRYPT////////

///////Step 1 :- Install bcrypt using npm i and require it in atom////////
///////Step 2 :- Create variable saltRounds and assign 10 to it. ////////
///////Step 3 :-  hash the login password on app.post(/login) with md5(req.body.password)////////



require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
// no need for mongoose-encryption since we use md5 hashing.
// const encrypt = require('mongoose-encryption')

// no need for md5 encryption since we use bcrypt hashing and salting.
// const md5 = require ('md5')
const bcrypt = require('bcrypt')
const saltRounds = 10;

const app = express()

app.use(express.static("public"));

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

/////No need for userSchema encrypt since we use md5 Hash MAP now //////
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.

    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    newUser.save((err) => {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true) {
            res.render("secrets") 
          }
        });

      }
    }
  });

});


app.listen(3300, () => {
  console.log('Server started on port 3300')
})
