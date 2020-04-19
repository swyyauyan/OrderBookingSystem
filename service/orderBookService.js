var _ = require("lodash");
var Order = require("../model/order");

class OrderBookService {
  get() {
    console.log("********");
    console.log("NOT IMPLEMENTED: Get Order book");
    console.log("********");
  }

  async getOrderById(req, res) {
    var orderId = req.params.id;
    await Order.find({orderId: orderId}, function(err, result){
      if(result.length === 0){
        res.send('Cannot found order Id = ' + orderId);
      }else{
        res.send(result);
      }
    })
  }
}

module.exports = OrderBookService;
