var _ = require("lodash");
var Order = require("../model/order");

class OrderBookService {
  async get(res) {
    var bidOrders = await Order.find({ action: "BID" }).sort({
      price: -1,
      createAt: 1,
    });
    var askOrders = await Order.find({ action: "ASK" }).sort({
      price: 1,
      createAt: 1,
    });

    res.send({
      Bid: bidOrders,
      Ask: askOrders,
    });
  }

  async getOrderById(req, res) {
    var orderId = req.params.id;
    await Order.find({ orderId: orderId }, function (err, result) {
      if (result.length === 0) {
        res.send("Cannot found order Id = " + orderId);
      } else {
        res.send(result);
      }
    });
  }
}

module.exports = OrderBookService;
