var _ = require("lodash");
var Order = require("../model/order");
var SessionInformation = require("../model/sessionInformation");

var DEFAULT_INTERVAL = 1;
var DEFAULT_TRADING_PHRASE = "Continuous trading";

class IepService {
  async getValue(res) {
  
    var tradingPhrase = DEFAULT_TRADING_PHRASE;
    //CHECK
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      phrase
    ) {
      tradingPhrase = _.get(phrase, "value", DEFAULT_TRADING_PHRASE);
    });

    if (
      tradingPhrase == "Pre-opening session - Order Input Period" ||
      tradingPhrase == "Pre-opening session - Pre-order matching Period"
    ) {
      var possibleIep = await this.getPossibleIep();
      res.send(possibleIep);
    } else {
      var iepValue;
      await SessionInformation.findOne({ key: "iepValue" }, async function (
        err,
        phrase
      ) {
        iepValue = _.get(phrase, "value", "");
      });

      res.send("IEP = " + iepValue);
    }
  }

  async getPossibleResult(res) {
   
    var tradingPhrase = DEFAULT_TRADING_PHRASE;
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      phrase
    ) {
      tradingPhrase = _.get(phrase, "value", DEFAULT_TRADING_PHRASE);
    });

    if (
      tradingPhrase == "Pre-opening session - Order Input Period" ||
      tradingPhrase == "Pre-opening session - Pre-order matching Period"
    ) {
      var possibleResult = await this.getPossibleIepResults();
      res.send(possibleResult);
    } else {
        var iepResult;
        await SessionInformation.findOne({ key: "iepPossibleResult" }, async function (
          err,
          phrase
        ) {
            iepResult = _.get(phrase, "value", "");
        });
  
        res.send(JSON.stringify(iepResult));
    }
  }

  async getTradeResult(res) {
    
    var tradingPhrase = DEFAULT_TRADING_PHRASE;
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      phrase
    ) {
      tradingPhrase = _.get(phrase, "value", DEFAULT_TRADING_PHRASE);
    });

    if (
      tradingPhrase == "Pre-opening session - Order Input Period" ||
      tradingPhrase == "Pre-opening session - Pre-order matching Period"
    ) {
      var tradeResults = [];
      var possibleResult = await this.getPossibleIepResults();

      for (const result of possibleResult) {
        var trade = await this.getTradeTable(result);
        tradeResults.push({ iep: result.iep, trade: trade });
      }
      res.send(tradeResults);
    } else {
        var iepTrade;
        await SessionInformation.findOne({ key: "iepTrade" }, async function (
          err,
          phrase
        ) {
            iepTrade = _.get(phrase, "value", "");
        });
  
        res.send(JSON.stringify(iepTrade));
    }
   
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

  async setIep() {
    var possibleResult = await this.getPossibleIepResults();

    //STEP 1: Found the highest Iep => Maybe highest IEP > 1
    var iep = await this.getMaxIep(possibleResult);

    //STEP 2: Store the highest Iep result in database and the trade table

    await this.saveIep(iep);

    //STEP 3: Do trade using the highest Iep
    //STEP 4: Check the order table.
  }

  async getMaxIep(possibleResult) {
    var highestShared = 0;

    possibleResult.forEach((result) => {
      if (result.matchedShared > highestShared) {
        highestShared = result.matchedShared;
      }
    });

    var possibleMaxIeps = _.remove(possibleResult, function (result) {
      return result.matchedShared == highestShared;
    });

    if (possibleMaxIeps.length == 1) {
      return possibleMaxIeps[0];
    } else {
      //RULE 2, 3, 4 is here
      return {};
    }
  }

  async saveIep(maxIep) {
    var iepValue = _.get(maxIep, "iep", "");

    await SessionInformation.findOne({ key: "iepValue" }, async function (
      err,
      oldIep
    ) {
      if (oldIep === null) {
        await new SessionInformation({
          key: "iepValue",
          value: iepValue,
        }).save();
      } else {
        oldIep.value = iepValue;
        oldIep.save();
      }
    });

    await SessionInformation.findOne(
      { key: "iepPossibleResult" },
      async function (err, oldIepPossibleResult) {
        if (oldIepPossibleResult === null) {
          await new SessionInformation({
            key: "iepPossibleResult",
            value: maxIep,
          }).save();
        } else {
          oldIepPossibleResult.value = maxIep;
          oldIepPossibleResult.save();
        }
      }
    );

    var trade = await this.getTradeTable(maxIep);
    await SessionInformation.findOne({ key: "iepTrade" }, async function (
      err,
      oldIepPossibleResult
    ) {
      if (oldIepPossibleResult === null) {
        await new SessionInformation({
          key: "iepTrade",
          value: trade,
        }).save();
      } else {
        oldIepPossibleResult.value = trade;
        oldIepPossibleResult.save();
      }
    });
  }
}
module.exports = IepService;
