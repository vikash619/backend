const mongoose = require("mongoose");

const resumeSchema = mongoose.Schema({}, {strict:false});
var Resume = mongoose.model('resume', resumeSchema);

module.exports = Resume;

//save resume
module.exports.addResume = function (newUserResume, callback){
    newUserResume.save(callback);
}