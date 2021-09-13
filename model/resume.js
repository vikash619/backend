const mongoose = require("mongoose");

const resumeSchema = mongoose.Schema({}, {strict:false});
const Resume = mongoose.model('resume', resumeSchema);

module.exports = Resume;

//save resume
module.exports.adduserResume = function (newUserResume, callback){
    newUserResume.save(callback);
}