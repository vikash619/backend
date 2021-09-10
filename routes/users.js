const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const User = require("../model/user");
const Resume = require("../model/resume")
const config = require("../config/database");


router.post("/register", async (req,res,next)=>{
    // console.log(req.body);
    const newUser = new User({
        fullName : req.body.fullName,
        userName : req.body.userName,
        email : req.body.email,
        password : req.body.password,
        confirmpassword : req.body.confirmpassword
    });

    // alternative of above method : just two line of code
    // const body = req.body;
    // const newUser = new User(body);

    await User.addUser(newUser, (error,user)=>{
        if(error){
            res.status(422).json({success:false, message:"failed to register"})
        }else{
            res.status(200).json({success:true, message:"user added succssfully", user:newUser});
        }
    })

    // console.log("added user successfully "+addedUser);
});

router.post("/authenticate", (req,res,next)=>{
    userName = req.body.userName;
    password = req.body.password;

    User.findByUsername(userName, (error,user)=>{
        if(error) throw error;
        if(!user){
            return res.json({success:false, message:"User not found"});
        }

        User.comparepassword(password, user.password, (error, isMatch)=>{
            if(error) throw error;
            if(isMatch){
                const token = jwt.sign(user.toJSON(), config.secret, {
                    expiresIn: 180                                                   //3 mint
                })

                res.cookie("auth", token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: false,
                    secure: false,
                  });

                res.json({
                    success:true,
                    token : 'JWT '+token,
                    user : {
                        id: user._id,
                        fullName : user.fullName,
                        userName : user.userName,
                        email : user.email
                    }
                })
            }else{
               return res.json({success:false, message:"wrong credentials"});
            }
        })
        
    })
})

router.get("/profile", passport.authenticate('jwt', {session:false}) ,(req,res,next)=>{
    res.json({user : req.user});
})

router.post("/profile/update/:id", (req,res)=>{
    const _id = req.params.id;
    
    User.findByIdAndUpdate(_id, req.body,{ useFindAndModify: false })
        .then((data)=>{
            if(!data){
                res.json({success:false, message:"cannot update"})
            }else{
                res.json({success:true, message:"user updated successfully"})
            }
        })
        .catch((error)=>{
            res.json({success:false, message:"not update"});
        })
})

router.post("/resume", (req,res)=>{
    
})

module.exports = router;