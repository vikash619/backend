const mongoose = require('mongoose');
const verificationSchema = mongoose.Schema({}, {strict:false});
const Verification = mongoose.model('verification', verificationSchema);

module.exports = Verification;

//save otp
module.exports.addVerificationotp = function (newUserotp,callback){
    newUserotp.save(callback);
}