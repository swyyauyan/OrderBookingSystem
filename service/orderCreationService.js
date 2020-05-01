var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var historyList = require("../model/historyCodeList");
var OrderOverviewService = require("../service/orderOverviewService");
var orderOverviewService = new OrderOverviewService();
var SessionInformation = require("../model/sessionInformation");

class OrderCreationService {
  async create(request, res) {
    var id = this.getOrderId();

    var tradingPhrase = "";
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (err,phrase) {
      tradingPhrase = _.get(phrase, "value", "Continuous trading");
    });

    
    request = this.orderPreHandling(request, tradingPhrase);
    console.log(request);

    var action = _.get(request, "action");
    var type = _.get(request, "type");

    console.log(tradingPhrase);
    if (this.orderValidation(action) && this.checkTradingPhrase(id, request)) {
      this.createOrder(request, id);
    }else{
      res.status(400);
    }
    res.send(id);
  }

  orderValidation(action) {
    if (action == "BID" || action == "ASK") {
      return true;s
    } else {
      this.createLog(id, 97, request, {});
      return false;
    }
  }

  checkTradingPhrase(id, request) {
    if (
      request.tradingPhrase == "Continuous trading" ||
      request.tradingPhrase == "Pre-opening session - Order Input Period" ||
      (request.tradingPhrase =="Pre-opening session - Pre-order matching Period" &&
        request.type == "MARKET")
    ) {
      return true;
    }
    this.createLog(id, 96, request, {'tradingPhrase': request.tradingPhrase});
    return false;
  }

  orderPreHandling(request, tradingPhrase) {
    request.action = request.action.toUpperCase();
    request.type = request.type.toUpperCase();
    if (request.type.toUpperCase() == "MARKET") {
      var price =
        _.get(request, "action").toUpperCase() == "BID"
          ? Number.MAX_SAFE_INTEGER
          : 0;
      request.price = price;
    }
    request.tradingPhrase = tradingPhrase;
    return request;
  }

  async createOrder(request, id) {
    this.createLog(id, 1, request, { type: request.type });

    var openOrders;

    this.isBidOrder(request)
      ? (openOrders = await Order.find({ action: "ASK", status: "OPEN" }).sort({
          price: 1,
        }))
      : (openOrders = await Order.find({ action: "BID", status: "OPEN" }).sort({
          price: -1,
        }));

    if (openOrders.length === 0) {
      this.notClosedOrderHandling(request, id, 2, {});
    } else if (this.requestPriceChecking(request, openOrders)) {
      this.notClosedOrderHandling(request, id, 3, {});
    } else {
      this.orderHandling(id, request, openOrders);
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
      var priceChecking = this.isBidOrder(request)
        ? request.price >= openOrders[i].price //BID ORDER
        : openOrders[i].price >= request.price; //ASK ORDER

      orderOverviewService.updateLastRecord(
        openOrders[i].price,
        Math.min(openOrders[i].qty, remainQty)
      );

      if (priceChecking) {
        if (openOrders[i].qty >= remainQty) {
          await this.writeQtyToOrder(
            openOrders[i]._id,
            openOrders[i].qty - remainQty
          );
          remainQty = 0;
          this.createLog(openOrders[i].orderId, 4, request, {
            otherOrderId: id,
          });
          this.createLog(id, 98, request, {
            otherOrderId: openOrders[i].orderId,
          });
        } else if (openOrders[i].qty < remainQty) {
          remainQty = remainQty - openOrders[i].qty;
          await this.writeQtyToOrder(openOrders[i]._id, 0);
          this.createLog(id, 4, request, {
            otherOrderId: openOrders[i].orderId,
          });
          this.createLog(openOrders[i].orderId, 98, request, {
            otherOrderId: id,
          });
        }
      }
      if (remainQty == 0) {
        break;
      }
    }

    if (remainQty > 0) {
      request.qty = remainQty;
      this.notClosedOrderHandling(request, id, 5, {}); //TODO
    }

    //CLEAR RECORD
    await Order.find({}, function (err, orders) {
      orders.forEach(async (order) => {
        if (order.qty == 0) {
          await order.remove();
        }
      });
    });
  }

  async writeQtyToOrder(id, qty) {
    await Order.findOne({ _id: id }, async function (err, order) {
      order.qty = qty;
      await order.save();
    });
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
      6,
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
        code: code,
        description: des.description
          .replace("%ORDER_TYPE%", _.get(keyPair, "type", ""))
          .replace("%TRADING_PHRASE%", _.get(keyPair, "tradingPhrase", ""))
          .replace("%OTHER_ORDER_ID%", _.get(keyPair, "otherOrderId", "")),
      },
      createAt: Date.now(),
    });
    await history.save();
  }

  async clearRecord() {
    
  }

  getOrderId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  async getTradingPhrase() {}

  // async canCreateOrder(orderType) {
  //   console.log("canCreateOrder = ");
  //   await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
  //     err,
  //     phrase
  //   ) {
  //     console.log("tradingPhrase = " + phrase);
  //     if (phrase === null) {
  //       await new SessionInformation({
  //         key: "tradingPhrase",
  //         value: "Continuous trading",
  //       }).save();
  //       console.log('1');
  //       return { 'allow': true };
  //     } else {
  //       var tradingPhrase = phrase.value;
  //       if (
  //         tradingPhrase == "Continuous trading" ||
  //         tradingPhrase == "Pre-opening session - Order Input Period" ||
  //         (tradingPhrase == "Pre-opening session - Pre-order matching Period" &&
  //           orderType == "MARKET")
  //       ) {
  //         console.log('2');
  //         return true;
  //       } else {
  //         console.log('3');
  //         return { 'allow': false, 'tradingPhrase': tradingPhrase };
  //       }
  //     }
  //   });
  // }
}

module.exports = OrderCreationService;
