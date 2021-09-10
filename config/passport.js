const ExtractJwt = require("passport-jwt").ExtractJwt;
const Strategyjwt = require("passport-jwt").Strategy;
const config = require("../config/database");
const User = require("../model/user");

module.exports = function (passport){
    let opts = { };

    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt")
    opts.secretOrKey = config.secret;

    passport.use(new Strategyjwt(opts, (jwt_payload, done)=>{
        // console.log(jwt_payload._id);

        User.findUserById(jwt_payload._id, (error, user)=>{
            if(error){
                return done(error, false);
            }

            if(user){
               return done(null, user);
            }else{
               return done(null, false);
            }
        })
    }))
}
