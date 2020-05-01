var _ = require("lodash");
var historyList = require("../model/historyCodeList");

var OrderHistory = require("../model/orderHistory");

class OrderHistoryService {
  async getHistoriesByOrderId(req, res) {
    var orderId = req.params.id;
    await OrderHistory.find({ orderId: orderId }, function (err, result) {
      res.send(result);
    });
  }

  async createLog(id, code, request, keyPair) {
    var des = historyList.getHistory(code);
    var history = new OrderHistory({
      orderId: id,
      request: request,
      description: {
        code: code,
        description: des.description
          .replace("%ORDER_TYPE%", _.get(keyPair, "type", ""))
          .replace("%OTHER_ORDER_ID%", _.get(keyPair, "otherOrderId", "")
          .replace("%TRADING_PHRASE%", _.get(keyPair, "tradingPhrase", ""))),
      },
      createAt: Date.now(),
    });
    await history.save();
  }
}

module.exports = OrderHistoryService;
