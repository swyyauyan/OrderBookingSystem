var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var historyList = require("../model/historyCodeList");

class OrderCreationService {
  create(request) {
    var id = this.getOrderId();
    var action = _.get(request, "action").toUpperCase();
    if (action == "BID" || action == "ASK") {
      this.createOrder(request, id);
    } else {
      this.createLog(id, 0.3, request, {});
    }
    return id;
  }

  orderPreHandling(request) {
    if (request.type.toUpperCase() == "MARKET") {
      var qty =
        _.get(request, "action").toUpperCase() == "BID"
          ? Number.MAX_SAFE_INTEGER
          : Number.MIN_SAFE_INTEGER;
      request.qty = qty;
    }
    return request;
  }

  async createOrder(request, id) {
    this.createLog(id, 1, request, {type: request.type});

    var openOrders;

    this.isBidOrder(request)
      ? (openOrders = await Order.find({ action: "ASK", status: "OPEN" }).sort({
          price: -1,
        }))
      : (openOrders = await Order.find({ action: "BID", status: "OPEN" }).sort({
          price: 1,
        }));

    if (openOrders.length === 0) {
      this.notClosedOrderHandling(request, id, 2, {});
    } else if (this.requestPriceChecking(request, openOrders)) {
      this.notClosedOrderHandling(request, id, 3, {});
    } else {
      this.orderHandling(id, request, openOrders); //TODO: NEED TO TEST.
    }
  }

  requestPriceChecking(request, openOrders) {
    return this.isBidOrder(request)
      ? openOrders[0].price > request.price
      : request.price > openOrders[0].price;
  }

  isBidOrder(request) {
    return request.action.toUpperCase() == "BID";
  }

  async orderHandling(id, request, openOrders) {
    var remainQty = request.qty;
    for (let i = 0; i < openOrders.length; i++) {
      var priceChecking = this.isBidOrder(request) ? 
      request.price >= openOrders[i].price : //BID ORDER
      openOrders[i].price >= request.price; //ASK ORDER

      if(priceChecking){
        if(openOrders[i].qty >= remainQty){
          await this.writeQtyToOrder(openOrders[i].id, (openOrders[i].qty - remainQty));
          remainQty = 0;
          this.createLog(id, 99, request, {otherOrderId: openOrders[i].id});
          this.createLog(openOrders[i].id, 4, request, {otherOrderId: id});
        }else if(openOrders[i].qty < remainQty){
          remainQty = remainQty - openOrders[i].qty;
          await this.writeQtyToOrder(openOrders[i].id, 0);
          this.createLog(id, 4, request, {otherOrderId: openOrders[i].id});
          this.createLog(openOrders[i].id, 99, request, {otherOrderId: id});
        }
      }
      if(remainQty == 0) { break; }
    }

    if (remainQty > 0) {
      request.qty = remainQty;
      this.notClosedOrderHandling(request, id, 5, {}); //TODO
    }
    this.clearRecord();
  }


  async writeQtyToOrder(id, qty){
    var order = await Order.find({ id: id });
    order.qty = qty;
    await order.save();
  }

  notClosedOrderHandling(request, id, code, keyPair) {
    this.createLog(id, code, request, keyPair);
    request.type.toUpperCase() == "LIMIT"
      ? this.addToOrderBook(
          id,
          request.action.toUpperCase(),
          request.type.toUpperCase(),
          request.qty,
          request.price
        )
      : this.createLog(id, 99, request, {});
  }

  async addToOrderBook(id, action, type, qty, price) {
    this.createLog(
      id,
      2,
      { action: action, type: type, qty: qty, price: price },
      {}
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

  async createLog(id, code, request, keyPair) {
    var des = historyList.getHistory(code);
    var history = new OrderHistory({
      orderId: id,
      request: request,
      description: {
        code: des.code,
        description: des.description
        .replace("%ORDER_TYPE%", _.get(keyPair, 'type', ''))
        .replace("%OTHER_ORDER_ID", _.get(keyPair, 'otherOrderId', ''))
      },
      createAt: Date.now(),
    });
    await history.save();
  }

  clearRecord(){
    var orders = Order.find({});
    orders.forEach(order => {
      if(order.qty == 0) {
        order.remove();
      }
    });
  }

  getOrderId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = OrderCreationService;
