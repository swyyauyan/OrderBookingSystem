var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
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
      await SessionInformation.findOne(
        { key: "iepPossibleResult" },
        async function (err, phrase) {
          iepResult = _.get(phrase, "value", "");
        }
      );

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

    var remainedShared = iepResult.matchedShared;
    bidList.forEach((bid) => {
      if (remainedShared > 0) {
        var bidQty = bid.qty;
        for (var i = 0; i < askList.length; i++) {
          if (bidQty > 0) {
            if (bidQty >= askList[i].qty) {
              bidQty = bidQty - askList[i].qty;
              remainedShared = remainedShared - askList[i].qty;
              tradeResults.push({
                buyId: bid.orderId,
                TradeGenrated: askList[i].qty,
                askId: askList[i].orderId,
              });
              askList[i].qty = 0;
            } else {
              askList[i].qty = askList[i].qty - bidQty;
              remainedShared = remainedShared - bidQty;
              tradeResults.push({
                buyId: bid.orderId,
                TradeGenrated: bidQty,
                askId: askList[i].orderId,
              });
              bidQty = 0;
            }
          }

          askList = _.remove(askList, function (ask) {
            return ask.qty != 0;
          });
        }
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

    var normalOrderImbalance = Math.max(accBidQty, accAskQty) - matchedShared;

    return {
      iep: iep,
      accBidQty: accBidQty,
      accAskQty: accAskQty,
      matchedShared: matchedShared,
      normalOrderImbalance: normalOrderImbalance,
      accBidList: accBidList,
      accAskList: accAskList,
    };
  }

  async setIep() {
    var possibleResult = await this.getPossibleIepResults();

    //STEP 1: Found the highest Iep => Maybe highest IEP > 1
    //STEP 2: Store the highest Iep result in database and the trade table

    await this.saveIep(await this.getMaxIep(possibleResult));

    //STEP 3: Do trade using the highest Iep
    await this.doTrade(await this.getMaxIep(possibleResult));
    //STEP 4: Check the order table.
  }

  async doTrade(maxIep) {
    var trade = await this.getTradeTable(maxIep);
    for (const obj of trade) {
      await Order.findOne({ orderId: obj.buyId }, async function (err, bid) {
        console.log(
          "bid.qty = bid.qty - trade.TradeGenrated => " +
            "bid.qty = " +
            bid.qty +
            " ; trade.TradeGenrated = " +
            obj.TradeGenrated
        );
        bid.qty = bid.qty - obj.TradeGenrated;
        await bid.save();
        //ADD LOG
      });

      await Order.findOne({ orderId: obj.askId }, async function (err, ask) {
        console.log(
          "ask.qty = ask.qty - trade.TradeGenrated => " +
            "ask.qty = " +
            ask.qty +
            " ; trade.TradeGenrated = " +
            obj.TradeGenrated
        );
        ask.qty = ask.qty - obj.TradeGenrated;
        await ask.save();
        //ADD LOG
      });
    }

    await Order.find({}, function (err, orders) {
      orders.forEach(async (order) => {
        if (order.qty == 0) {
          await order.remove();
        }
      });
    });
  }

  async getMaxIep(possibleResult) {
    //Rule 1:
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
    } else if (possibleMaxIeps.length > 1) {
      //RULE 2
      var iepNormalOrderImbalance =  await this.getIepByNormalOrderImbalance(possibleMaxIeps);
      
      if(iepNormalOrderImbalance.length == 1){
          console.log('Rule 2: iepNormalOrderImbalance = ' + JSON.stringify(iepNormalOrderImbalance));
        return iepNormalOrderImbalance[0];
      } else if(iepNormalOrderImbalance.length > 1){

        var lowerPrice = _.maxBy(iepNormalOrderImbalance, 'iep');
        var highestPrice = _.maxBy(iepNormalOrderImbalance, 'iep');

          console.log('lowerPrice = ' + JSON.stringify(lowerPrice));
          console.log('highestPrice = ' + JSON.stringify(highestPrice));

          if(iepNormalOrderImbalance[0].accBidQty > iepNormalOrderImbalance[0].accAskQty){
            console.log('Rule 3: accBidQty > acc Ask Qty');
            return highestPrice;
          }else if(iepNormalOrderImbalance[0].accBidQty < iepNormalOrderImbalance[0].accAskQty){
            console.log('Rule 3: accBidQty < acc Ask Qty');
           return lowerPrice;
          }else{
              var lastClosingPrice = 0;
              await SessionInformation.findOne({ key: "closingPrice" }, async function (
                err,
                phrase
              ) {
                lastClosingPrice = _.get(phrase, "value");
              });

              if(lastClosingPrice === 0){
                return highestPrice;
              } else{
                  //TODO: find a closed number in the list with the closing price.
                  return highestPrice; //TODO
              }
          }
      }
    }
  }

  async getIepByNormalOrderImbalance(possibleMaxIeps) {
    var lowerImbalance = possibleMaxIeps[0].normalOrderImbalance;
    
    possibleMaxIeps.forEach((result) => {
      if (lowerImbalance < _.get(result,'normalOrderImbalance')) {
        lowerImbalance = result.normalOrderImbalance;
      }
    });

    console.log('lowerImbalance = ' + lowerImbalance);

    var possibleMaxIeps = _.remove(possibleMaxIeps, function (result) {
      return result.normalOrderImbalance == lowerImbalance;
    });

    return possibleMaxIeps; // If more than one here, need to use rule 3.
  }

  async saveIep(maxIep) {
    console.log("Save IEP = " + JSON.stringify(maxIep));
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
