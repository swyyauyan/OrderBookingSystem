var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  orderId: String,
  action: String,
  type: String,
  qty: Number,
  price: Number,
  status: String,
  createAt: Date,
});

module.exports = mongoose.model("order", OrderSchema);
