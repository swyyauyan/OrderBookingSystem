var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var OrderOverviewSchema = new Schema({
    lstPrc: Number,
    lstVol: Number,
    lstTime: Date,
    totalVol: Number,
    high: Number,
    low: Number,
});

module.exports = mongoose.model("orderOverview", OrderOverviewSchema);
