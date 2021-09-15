const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcryptjs = require("bcryptjs");
const User = require("../model/user");
const Resume = require("../model/resume")
const config = require("../config/database");


router.post("/register", async (req, res, next) => {
    // console.log(req.body);
    const newUser = new User({
        fullName: req.body.fullName,
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword
    });

    // alternative of above method : just two line of code
    // const body = req.body;
    // const newUser = new User(body);

    await User.addUser(newUser, (error, user) => {
        if (error) {
            res.status(422).json({ success: false, message: "failed to register" })
        } else {
            res.status(200).json({ success: true, message: "user added succssfully", user: newUser });
        }
    })

    // console.log("added user successfully "+addedUser);
});

router.post("/authenticate", (req, res, next) => {
    userName = req.body.userName;
    password = req.body.password;

    User.findByUsername(userName, (error, user) => {
        if (error) throw error;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        User.comparepassword(password, user.password, (error, isMatch) => {
            if (error) throw error;
            if (isMatch) {
                const token = jwt.sign(user.toJSON(), config.secret, {
                    expiresIn: 180                                                   //3 mint
                })

                res.cookie("jwt", token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: false,
                    secure: false,
                });

                res.status(201).json({
                    success: true,
                    token: 'JWT ' + token,
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        userName: user.userName,
                        email: user.email
                    }
                })
            } else {
                return res.status(422).json({ success: false, message: "wrong credentials" });
            }
        })

    })
})

router.get("/profile", passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.json({ user: req.user });
})

router.post("/profile/update/:id", (req, res) => {
    const _id = req.params.id;

    User.findByIdAndUpdate(_id, req.body, { useFindAndModify: false })
        .then((data) => {
            if (!data) {
                res.status(422).json({ success: false, message: "cannot update" })
            } else {
                res.status(200).json({ success: true, message: "user updated successfully" })
            }
        })
        .catch((error) => {
            res.status(422).json({ success: false, message: "not update" });
        })
})

router.get("/resume", (req, res)=>{
    if(!req.cookies){
        res.json({success:false, message:"please give cookie"});
    }

    const userCookie = req.cookies.jwt;
    const decoded = jwt.decode(userCookie);
    const userID = decoded._id;

    Resume.findOne({userID:userID})
    .then((data)=>{
        res.status(201).json({success:true, message:"resume data founded", resumeData:data});
    })
    .catch((err)=>{
        res.status(422).json({success:false, message:"Couldn't found resume data"})
    });
})

router.post("/resume", async (req, res) => {

    if (!req.cookies) {

        res.status(422).json({ success: false, message: "please send cookie" });

    } else {

        const resumeData = req.body;
        const userCookie = req.cookies.jwt;
        const decoded = jwt.decode(userCookie);
        resumeData["userID"] = decoded._id;
        const userID = decoded._id;

        const saveResumeData = new Resume({
            userID: resumeData.userID,
            fullName: resumeData.fullName,
            contact: resumeData.contact,
            email: resumeData.email,
            address: resumeData.address,
            github: resumeData.github,
            linkedin: resumeData.linkedin,
            objective: resumeData.objective,
            academicQli: resumeData.academicQli,
            workExp: resumeData.workExp
        });
        
        Resume.findOne({userID:userID}, async (err, data)=>{

            if(err) throw err;

            if(data){
                Resume.findOneAndUpdate({userID:userID}, resumeData, (err,olddata)=>{
                    if(olddata){
                        console.log(olddata);
                        res.status(201).json({success:true, message:"Resume data updated successfully"});
                    }else{
                        console.log(err);
                        res.status(422).json({success:false, message:"Resume data not updated"});
                    }
                })
            }else{
                const savedResume = await saveResumeData.save();
                res.status(201).json({success:true, message:"Resume data saved successfully"});
            }
        })
        
        //You can use this below function also
        // Resume.addResume(resumeData, (error, user)=>{
        //     if(error){
        //         res.status(422).json({success:false, message:"not able to save user resume data"});
        //     }else{
        //         res.status(201).json({success:true, message:"user resume data saved successfully"});
        //     }
        // })
    }
});

// router.get("/resumetemplate", (req,res)=>{
//     if(!req.cookies){
//         res.status(422).json({success:false, message:"cookie not available please send it"});
//     }

//     const userCookie = req.cookies.jwt;
//     const decoded = jwt.decode(userCookie);
//     const userID = decoded._id;

//     Resume.findById({userID:userID})
//     .then((data)=>{
//         res.status(201).json({success:true, message:"resume data found successfully"});
//     })
//     .catch((error)=>{
//         res.status(422).json({success:false, message:"something went wrong"});
//     })
// })

// you can use this seperate UPDATE route also

// router.post("/resume/update", (req, res) => {
//     if (!req.cookies) {
//         res.status(422).json({ success: false, message: "please send cookie" });
//     }

//     const resumeData = req.body;
//     const userCookie = req.cookies.jwt;
//     const decoded = jwt.decode(userCookie);
//     resumeData["userID"] = decoded._id;
//     const userID = decoded._id;
//     // console.log(decoded);
//     Resume.findOneAndUpdate({userID:userID}, resumeData, (err, data)=>{
//         if(data){
//             console.log(data);
//         }else{
//             console.log(err);
//         }
//     })
// })

module.exports = router;