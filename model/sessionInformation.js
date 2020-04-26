var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var SessionInformationSchema = new Schema({
    key: String,
    value: Object
})


module.exports = mongoose.model("sessionInformation", SessionInformationSchema);
