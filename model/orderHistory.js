var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var OrderHistorySchema = new Schema({
  orderId: String,
  request: Object,
  description: Object,
  createAt: Date
});

module.exports = mongoose.model('orderHistory', OrderHistorySchema );