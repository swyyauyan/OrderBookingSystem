var _ = require("lodash");
var Order = require("../model/order");
var SessionInformation = require("../model/sessionInformation");

var DEFAULT_INTERVAL = 1;
class IepService {
  async getValue(res) {
    //STEP 1: Re - calculate "Possible IEP list."
    //"Pre-opening session - Order Input Period",
    // "Pre-opening session - Pre-order matching Period",

    var possibleIep = await this.getPossibleIep();

    res.send(possibleIep);

    //STEP 2: When set trading phrase to "Pre-opening session - Order matching Period"
    //Recalcurate the IEP value (Iep) and store in database.

    //STEP 3: Get from database
    //"Pre-opening session - Order matching Period"
    //"Pre-opening session - Blocking Period",
    // "Continuous trading"
  }

  async getPossibleResult(res) {
    //STEP 1: Re - calculate "Possible IEP posiible result."
    //"Pre-opening session - Order Input Period",
    // "Pre-opening session - Pre-order matching Period",

    var possibleResult = [];
    var possibleIep = await this.getPossibleIep();

    for(const iep of possibleIep){
        var result = await this.getPossibleIepResult(iep);
        possibleResult.push(result);
    }

    res.send(possibleResult);



    //STEP 2: When set trading phrase to "Pre-opening session - Order matching Period"
    //Recalcurate the IEP possible table (IepPossibleResult) and store in database.
    //STEP 3: Get from database
    //"Pre-opening session - Order matching Period"
    //"Pre-opening session - Blocking Period",
    // "Continuous trading"
  }

  async getTradeResult(res) {
    res.send("NOT IMPLEMENTED");
    //STEP 1: Re - calculate "Possible IEP posiible trade."
    //"Pre-opening session - Order Input Period",
    // "Pre-opening session - Pre-order matching Period",

    //STEP 2: When set trading phrase to "Pre-opening session - Order matching Period"
    //Recalcurate the IEP possible trade (IepPossibleTrade) and store in database.

    //STEP 3: Get from database
    //"Pre-opening session - Order matching Period"
    //"Pre-opening session - Blocking Period",
    // "Continuous trading"
  }

  async getPossibleIep() {
    var bidOrders = await Order.find({ action: "BID", type: "LIMIT" }).sort({
      price: -1,
      createAt: 1,
    });

    var askOrders = await Order.find({ action: "ASK", type: "LIMIT" }).sort({
      price: 1,
      createAt: 1,
    });

    var interval;
    await SessionInformation.findOne({ key: "interval" }, async function (
      err,
      phrase
    ) {
      interval = _.get(phrase, "value", DEFAULT_INTERVAL);
    });

    if (bidOrders.length == 0 || askOrders.length == 0) {
      return [];
    } else {
      var highestBidPrice = bidOrders[0].price;
      var lowerAskPrice = askOrders[0].price;

      var possibleIep = [];
      for (var iep = lowerAskPrice; iep <= highestBidPrice; iep = iep + interval) {
        possibleIep.push(iep);
        console.log("Possible iep = " + iep);
      }
      return possibleIep;
    }
  }

  async getPossibleIepResult(iep){

    var bidOrders = await Order.find({ action: "BID"}).sort({
      price: -1,
      createAt: 1,
    });

    var askOrders = await Order.find({ action: "ASK"}).sort({
      price: 1,
      createAt: 1,
    });

    var accBidQty = 0;
    var accAskQty = 0;

    bidOrders.forEach((order) => {
      if (order.type == "MARKET" || order.price >= iep) {
        accBidQty += order.qty;
      }
    });

    askOrders.forEach((order) => {
      if (order.type == "MARKET" || order.price <= iep) {
        accAskQty += order.qty;
      }
    });

    var matchedShared = Math.min(accBidQty, accAskQty);

    return {
      iep: iep,
      accBidQty: accBidQty,
      accAskQty: accAskQty,
      matchedShared: matchedShared,
      accBidList: await this.getRemainList(bidOrders, matchedShared),
      accAskList: await this.getRemainList(askOrders, matchedShared),
    };
  }

  async getRemainList(orders, shared) {
    var accList = [];
    var remainedShared = shared;
    orders.forEach((order) => {
      if (remainedShared > 0) {
        accList.push(order);
        remainedShared = remainedShared - order.qty;
      }
    });

    return accList;
  }

}
module.exports = IepService;
