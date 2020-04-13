var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var historyList = require("../model/historyCodeList");

class OrderCreationService {
  create(request) {
    var id = this.getOrderId();
    var type = _.get(request, 'action').toUpperCase();
    if(type == 'BID' || type == 'ASK'){
      this.createOrder(request, id);
    }else{
      this.createLog(id, request, 0.3);
    }
    return id;
  }

  async createOrder(request, id){
    this.createLog(id, request, 1);

    var isBidOrder = request.action.toUpperCase() == 'BID';
    
    var openOrders;
    
    isBidOrder ? 
    openOrders = await Order.find({ action: "ASK", status: "OPEN", }).sort({ price: -1 }) :
    openOrders = await Order.find({ action: "BID", status: "OPEN", }).sort({ price: 1 });

    if (openOrders.length === 0) {
      this.notClosedOrderHandling(request, id, 2);
    } else if (this.requestPriceChecking(isBidOrder, openOrders, request.price)) {
      this.notClosedOrderHandling(request, id, 3);
    } else {

    }
  }

  requestPriceChecking(isBidOrder, openOrders, requestPrice){
    return isBidOrder ?  
    openOrders[0].price > requestPrice :
    requestPrice > openOrders[0].price;
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
      description: historyList.getHistory(request, code),
      createAt: Date.now(),
    });
    await history.save();
  }

  getOrderId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = OrderCreationService;
