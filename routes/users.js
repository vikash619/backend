
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Resume = require("../model/resume")
const Verification = require("../model/verification");
const config = require("../config/database");
const bcryptjs = require("bcryptjs");

const accountSid = 'ACa85ceef5ab901ff11ba9641d4d3e7a55';
const authToken = '01baa2454af141018ea2cc9d94962591';
const client = require('twilio')(accountSid, authToken);

function generateOTP() {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

router.post("/generateotp", (req, res) => {
    if (!req.cookies) {

        res.status(422).json({ success: false, message: "please send cookie" });

    } else {
        const veriData = req.body;
        const userCookieveri = req.cookies.jwt;
        const decodedveri = jwt.decode(userCookieveri);
        veriData["verificationID"] = decodedveri._id;
        const verificationID = decodedveri._id;

        var randomNumber = generateOTP();
        client.messages
            .create({
                body: randomNumber,
                messagingServiceSid: 'MG14b35c7322816944af6ae03483126f7d',
                to: '+917895961759'
            })
            .then(message => {
                console.log('mesage sent otp: ' + randomNumber)
            })
            .catch((e) => {
                console.log('OTP error')
                console.log(e)
            })

        veriData["userVerificationOTP"] = randomNumber;

        const saveUserVerificationData = new Verification({
            verificationID: veriData.verificationID,            //
            userVerificationOTP: randomNumber
        });

        Verification.findOne({ verificationID: verificationID }, async (err, data) => {
            if (err) throw err;

            if (data) {
                Verification.findOneAndUpdate({ verificationID: verificationID }, veriData, (err, olddata) => {
                    if (olddata) {
                        // console.log("my old data" + olddata);
                        res.status(201).json({ success: true, message: "user verificaton udpated" })
                    } else {
                        // console.log(err)
                        res.status(422).json({ success: false, message: "user verification failed" })
                    }
                })
            } else {
                const saveduserVerificationData = await saveUserVerificationData.save();
                res.status(201).json({ succ: true, message: "verification data saved successfully" });
            }
        })
    }
})

router.post("/verifyotp", (req, res) => {
    if (!req.cookies) {

        res.status(422).json({ success: false, message: "please send cookie" });

    } else {
        const veriotp = req.body;
        console.log("veriotp " + veriotp.otp_number);

        const optNumber = veriotp.otp_number;
        console.log(optNumber);

        const userCookie = req.cookies.jwt;
        const decoded = jwt.decode(userCookie);
        const userID = decoded._id;


        Verification.findOne({ verificationID: userID }, (err, data) => {
            if (data) {
                if (data.userVerificationOTP == otpNumber) {
                    User.findOneAndUpdate(userID, { $set: { "verified": true } }, { useFindandModify: false })
                        .then((data) => {
                            console.log("modified data " + data);
                            res.status(201).json({ success: true, message: "user verified" });
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                }

            } else {
                res.status(422).json({ success: false, message: "incorrect otp" });
            }
        })
    }
})

// router.post("/makeVerifiedtrue", (req,res)=>{
//     if (!req.cookies) {
//         console.log("motherfucker");
//         res.status(422).json({ success: false, message: "please send cookie" });

//     }else{
//         console.log(req.body);

//         const userCookie = req.cookies("jwt");
//         const decoded = jwt.decode(userCookie);
//         const userID = decoded._id;
//         console.log(userID);

//         User.findByIdAndUpdate(userID, {$set : {"verified" : true}}, { useFindAndModify: false })
//         .then((data) => {
//             if (!data) {
//                 res.status(422).json({ success: false, message: "cannot modify verified property" })
//             } else {
//                 res.status(200).json({ success: true, message: "verified successfully modified "})
//             }
//         })
//         .catch((error) => {
//             res.status(422).json({ success: false, message: "not modified" });
//         })
//     }
// })



//Register function
router.post("/register", async (req, res, next) => {

    // console.log(req.body);
    const newUser = new User({
        fullName: req.body.fullName,
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword,
        verified: req.body.verified
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


//login function

router.post("/authenticate", (req, res, next) => {
    console.log("recieved data : " + req.body.userName + " " + req.body.password);

    userName = req.body.userName;
    password = req.body.password;

    User.findByUsername(userName, (error, user) => {
        if (error) throw error;
        if (!user) {
            console.log("user not found")
            return res.status(401).json({ success: false, message: "User not found" });
        }
       
        User.comparepassword(password, user.password, (error, isMatch) => {
            if (error) throw error;
            if (isMatch) {
                console.log("is match : "+isMatch);

                const token = jwt.sign(user.toJSON(), config.secret, {
                    expiresIn: 60000
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


//logout function

router.post('/logout', (req,res)=>{
    res.clearCookie('jwt');
    res.status(201).json({success: true, message:"cleared cookie successfully"});
})

router.get("/profile", passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.json({ user: req.user });
})

router.post("/profile/update/:id", (req, res) => {
    const _id = req.params.id;
    console.log("received data " + req.body.fullName+ " "+ req.body.userName+ " " + req.body.email+ " " + req.body.password+ " " + req.body.confirmpassword);

    User.findById(_id, (error, data) => {

        let saltRound = 10;
        let password = req.body.password;
        bcryptjs.genSalt(saltRound, (err, salt) => {
            bcryptjs.hash(password, salt, (err, hash) => {
                req.body.password = hash;
                req.body.confirmpassword = 0;
                console.log("hashed password "+ hash + " "+req.body.password )

                User.findByIdAndUpdate(_id, req.body, { useFindAndModify: false })
                    .then((olddata) => {
                        if (!data) {
                            res.status(422).json({ success: false, message: "cannot update" })
                        } else {

                            console.log("updated data" + olddata);
                            res.status(200).json({ success: true, message: "user updated successfully" })
                        }
                    })
                    .catch((error) => {
                        res.status(422).json({ success: false, message: "not update" });
                })
            })
        })
    })
})

router.get("/resume", (req, res) => {

    if (!req.cookies) {
        res.json({ success: false, message: "please give cookie" });
    }

    const userCookie = req.cookies.jwt;
    const decoded = jwt.decode(userCookie);
    console.log(decoded);
    const userID = decoded._id;
    console.log(userID);

    Resume.findOne({ userID: userID })
        .then((data) => {
            console.log('resume fetch');
            console.log(data);
            res.status(201).json({ success: true, message: "resume data founded", resumeData: data });
        })
        .catch((err) => {
            res.status(422).json({ success: false, message: "Couldn't found resume data" })
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
            designation: resumeData.designation,
            contact: resumeData.contact,
            email: resumeData.email,
            address: resumeData.address,
            website: resumeData.website,
            github: resumeData.github,
            linkedin: resumeData.linkedin,
            stackoverflow: resumeData.stackoverflow,
            skills: resumeData.skills,
            languages: resumeData.languages,
            interests: resumeData.interests,
            academicQli: resumeData.academicQli,
            workExp: resumeData.workExp,
            objective: resumeData.objective,
        });

        Resume.findOne({ userID: userID }, async (err, data) => {

            if (err) throw err;

            if (data) {
                Resume.findOneAndUpdate({ userID: userID }, resumeData, (err, olddata) => {
                    if (olddata) {
                        console.log(olddata);
                        res.status(201).json({ success: true, message: "Resume data updated successfully" });
                    } else {
                        console.log(err);
                        res.status(422).json({ success: false, message: "Resume data not updated" });
                    }
                })
            } else {
                const savedResume = await saveResumeData.save();
                res.status(201).json({ success: true, message: "Resume data saved successfully" });
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