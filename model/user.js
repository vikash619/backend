const mongoose = require("mongoose");
const passport =  require("passport");
const passportjwt = require("passport-jwt");
const bcryptjs = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    fullName : {
        type:String,
        required:true
    },

    userName : {
        type:String,
        required:true,
        unique:true
    },

    email : {
        type:String,
        required:true,
        unique:true
    },

    password : {
        type:String,
        required:true
    },

    confirmpassword : {
        type:String,
        required:true
    }
})

const User = new mongoose.model("User", UserSchema);
module.exports = User;

module.exports.findUserById = function(id, callback){
    User.findById(id, callback);
}

module.exports.findByUsername = function (userName, callback){              //this will return "user" if found
    const query = {userName : userName}
    User.findOne(query, callback);
}

module.exports.addUser = function (newUser,callback){
    bcryptjs.genSalt(10, (error, salt)=>{
        bcryptjs.hash(newUser.password, salt, (error, hash)=>{
            if(error) throw error;
            newUser.password = hash;
            newUser.confirmpassword = 0;
            newUser.save(callback);
        })
    })
}

module.exports.comparepassword = function(password, hash, callback){        //this will return "true or false"
    bcryptjs.compare(password, hash, (error, isMatch)=>{
        if(error) throw error;
        callback(null, isMatch);
    })
}