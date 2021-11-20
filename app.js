require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const passport = require("passport");
// const passportjwt = require("passport-jwt");
const cookieParser = require("cookie-parser");
const config = require("./config/database")
const path = require("path");

// connecting database

mongoose.connect(process.env.DB)               //useNewUrlParser, useUnifiedTopology, useFindAndModify, and useCreateIndex are no longer supported options
.then(()=>{
    console.log(`connection successful at ${config.database}`)
})
.catch((error)=>{
    console.log(error);
})


//Initialize app
const app = express();

//routes
const users = require('./routes/users');


//PORT
const PORT = process.env.PORT || 3000

// cors middleware
// app.use(cors());


//set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
app.set(express.urlencoded({extended:false}));

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200"); // update to match the domain you will make the request from
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,authorization"
  );
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })


//all routes
app.use('/users', users);

//path error
app.get("*", (req,res)=>{
  res.sendFile(process.cwd() + "/public/index.html");
})


//Server
app.listen(PORT, ()=>{
    console.log(`server listening to ${PORT}`)
})

