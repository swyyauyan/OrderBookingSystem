var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var historyList = require("../model/historyCodeList");

class OrderCreationService {
  create(request) {
    var id = this.getOrderId();
    switch (request.action.toUpperCase()) {
      case "BID":
        this.createBid(request, id);
        return id;
      case "ASK":
        this.createAsk(request, id);
        return id;
      default:
        this.createLog(id, request, 0.3);
        return id;
    }
  }

  async createBid(request, id) {
    this.createLog(id, request, 0.1);
    var openAskOrders =  await Order.find({ action: "ASK", status: "OPEN" }).sort({price: 1})
    
    if(openAskOrders.length === 0){
      this.notClosedOrderHandling(request, id, 1.1);
    } else if(openAskOrders[0].price > request.price){
      this.notClosedOrderHandling(request, id, 3.1);
    }

  }

  async createAsk(request, id) {
    this.createLog(id, request, 0.2);
    var openBidsOrders = await Order.find({ action: "BID", status: "OPEN" }).sort({price: -1})
    console.log('***');
    console.log(openBidsOrders);
    console.log('***');
    if(openBidsOrders.length === 0){
      this.notClosedOrderHandling(request, id, 1.2);
    } else if(request.price > openBidsOrders[0].price ){
      this.notClosedOrderHandling(request, id, 3.2);
    }
  }

  notClosedOrderHandling(request, id, code) {
    this.createLog(id, request, code);
    request.type.toUpperCase() == "LIMIT"
      ? this.addToOrderBook(
          id,
          request.action.toUpperCase(),
          request.type.toUpperCase(),
          request.qty,
          request.price
        )
      : this.createLog(id, request, 99.1);
  }

  async addToOrderBook(id, action, type, qty, price) {
    this.createLog(
      id,
      { action: action, type: type, qty: qty, price: price },
      2.1
    );
    var order = new Order({
      orderId: id,
      action: action.toUpperCase(),
      type: type.toUpperCase(),
      qty: qty,
      price: price,
      status: "OPEN",
      createAt: Date.now(),
    });
    await order.save();
  }

  async createLog(id, request, code) {
    var history = new OrderHistory({
      orderId: id,
      request: request,
      description: historyList.getHistory(code),
      createAt: Date.now(),
    });
    await history.save();
  }

  getOrderId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = OrderCreationService;
