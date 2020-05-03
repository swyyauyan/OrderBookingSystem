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

    var possibleResult = await this.getPossibleIepResults();
    res.send(possibleResult);

    //STEP 2: When set trading phrase to "Pre-opening session - Order matching Period"
    //Recalcurate the IEP possible table (IepPossibleResult) and store in database.
    //STEP 3: Get from database
    //"Pre-opening session - Order matching Period"
    //"Pre-opening session - Blocking Period",
    // "Continuous trading"
  }

  async getTradeResult(res) {
    //STEP 1: Re - calculate "Possible IEP posiible trade."
    //"Pre-opening session - Order Input Period",
    // "Pre-opening session - Pre-order matching Period",
    var tradeResults = [];
    var possibleResult = await this.getPossibleIepResults();

    for(const result of possibleResult){
        var trade = await this.getTradeTable(result);
        tradeResults.push({'iep': result.iep, 'trade': trade});
    }
    res.send(tradeResults);

    //STEP 2: When set trading phrase to "Pre-opening session - Order matching Period"
    //Recalcurate the IEP possible trade (IepPossibleTrade) and store in database.

    //STEP 3: Get from database
    //"Pre-opening session - Order matching Period"
    //"Pre-opening session - Blocking Period",
    // "Continuous trading"
  }

  async getTradeTable(iepResult) {
    var tradeResults = [];
    var askList = iepResult.accAskList;
    var bidList = iepResult.accBidList;

    bidList.forEach((bid) => {
      var bidQty = bid.qty;
      console.log(bidQty);
      for (var i = 0; i < askList.length; i++) {
        if (bidQty > 0) {
          if (bidQty >= askList[i].qty) {
            bidQty = bidQty - askList[i].qty;
            tradeResults.push({
              buyId: bid.orderId,
              TradeGenrated: iepResult.iep + "@" + askList[i].qty,
              askId: askList[i].orderId,
            });
            askList[i].qty = 0;
          } else {
            askList[i].qty = askList[i].qty - bidQty;
            tradeResults.push({
              buyId: bid.orderId,
              TradeGenrated: iepResult.iep + "@" + bidQty,
              askId: askList[i].orderId,
            });
            bidQty = 0;
          }
        }

        askList = _.remove(askList, function (ask) {
          return ask.qty != 0;
        });
      }
    });
    return tradeResults;
    //RETURN: buying id, trade genrated and asking id
  }

  async getPossibleIepResults() {
    var possibleResult = [];
    var possibleIep = await this.getPossibleIep();

    for (const iep of possibleIep) {
      var result = await this.getPossibleIepResult(iep);
      possibleResult.push(result);
    }

    return possibleResult;
  }

  async getPossibleIep() {
    //RETURN: Possible iep value list.
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
      for (
        var iep = lowerAskPrice;
        iep <= highestBidPrice;
        iep = iep + interval
      ) {
        possibleIep.push(iep);
        console.log("Possible iep = " + iep);
      }
      return possibleIep;
    }
  }

  async getPossibleIepResult(iep) {
    //INPUT: iep value , RETURN iep value's possible Iep result (acc Bid, acc Ask and matched shared)
    var bidOrders = await Order.find({ action: "BID" }).sort({
      price: -1,
      createAt: 1,
    });

    var askOrders = await Order.find({ action: "ASK" }).sort({
      price: 1,
      createAt: 1,
    });

    var accBidQty = 0;
    var accBidList = [];
    var accAskQty = 0;
    var accAskList = [];

    bidOrders.forEach((order) => {
      if (order.type == "MARKET" || order.price >= iep) {
        accBidQty += order.qty;
        accBidList.push(order);
      }
    });

    askOrders.forEach((order) => {
      if (order.type == "MARKET" || order.price <= iep) {
        accAskQty += order.qty;
        accAskList.push(order);
      }
    });

    var matchedShared = Math.min(accBidQty, accAskQty);


    return {
      iep: iep,
      accBidQty: accBidQty,
      accAskQty: accAskQty,
      matchedShared: matchedShared,
      accBidList: accBidList,
      accAskList: accAskList,
    };
  }

}
module.exports = IepService;
