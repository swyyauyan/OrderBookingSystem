var _ = require("lodash");
var OrderHistory = require("../model/orderHistory");

class OrderHistoryService {
  async getHistoriesByOrderId(req, res) {
    var orderId = req.params.id;
    await OrderHistory.find({ orderId: orderId }, function (err, result) {
      res.send(result);
    });
  }
}

module.exports = OrderHistoryService;
