var _ = require("lodash");
var Big = require("big-js");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var historyList = require("../model/historyCodeList");
var SessionInformation = require("../model/sessionInformation");

var DEFAULT_INTERVAL = 1;
var DEFAULT_TRADING_PHRASE = "Pre-opening session - Order Input Period";

class IepService {
  async getValue() {
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
      return possibleIep;
    } else {
      var iepValue = [];
      await SessionInformation.findOne({ key: "iepValue" }, async function (
        err,
        phrase
      ) {
        iepValue.push( _.get(phrase, "value", ""));
      });

      return iepValue;
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
          console.log(
            "Bid ID = " +
              bid.orderId +
              "; Bid qty = " +
              bidQty +
              "; Ask Id = " +
              askList[i].orderId +
              "; ask Qty = " +
              askList[i].qty
          );
          if (bidQty > 0) {
            if (bidQty >= askList[i].qty) {
              bidQty = bidQty - askList[i].qty;
              bid.qty = bidQty - askList[i].qty;
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

      var iep = lowerAskPrice;
      while(iep <= highestBidPrice){
        possibleIep.push(Number(iep));
        iep = (new Big(iep).add(new Big(interval)))
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

    console.log("****iep = " + iep);

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
    await this.doTrade();
    //STEP 4: Check the order table.
  }

  async doTrade(maxIep) {
    var maxIep = {};
    await SessionInformation.findOne(
      { key: "iepPossibleResult" },
      async function (err, iep) {
        maxIep = _.get(iep, "value");
      }
    );

    console.log("do trade : " + JSON.stringify(maxIep));

    var iepTrade = [];
    await SessionInformation.findOne({ key: "iepTrade" }, async function (
      err,
      iep
    ) {
      iepTrade = _.get(iep, "value");
    });

    console.log("do trade - iep Trade : " + JSON.stringify(iepTrade));

    for (const obj of iepTrade) {
      await Order.findOne({ orderId: obj.buyId }, async function (err, bid) {
        bid.qty = bid.qty - obj.TradeGenrated;
        await bid.save();
        // console.log(
        //   "Buy order: " +
        //     obj.buyId +
        //     " reduced stock: " +
        //     bid.qty +
        //     " by ask order: " +
        //     obj.askId
        // );
      });
      await this.createLog(obj.buyId, 11, {}, {'trade stock': obj.TradeGenrated, 'otherOrderId': obj.askId});     

      await Order.findOne({ orderId: obj.askId }, async function (err, ask) {
        ask.qty = ask.qty - obj.TradeGenrated;
        await ask.save();
        // console.log(
        //   "Ask order: " +
        //     obj.askId +
        //     " reduced stock: " +
        //     ask.qty +
        //     " by buy order: " +
        //     obj.buyId
        // );
      });
      await this.createLog(obj.askId, 11, {}, {'trade stock': obj.TradeGenrated, 'otherOrderId': obj.buyId}); 
    }
    var closedOrder = 0;
    await Order.find({}, function (err, orders) {
      orders.forEach(async (order) => {
        if (order.qty == 0) {
          closedOrder++;
          await order.remove();
        }
      });
    });

    await SessionInformation.findOne({ key: "orderOverview" }, async function (
      err,
      overview
    ) {
      var totalOrders = (await OrderHistory.distinct("orderId")).length;

      if(overview === null){
        await new SessionInformation({
            key: "orderOverview",
            value: {
            lstPrc: maxIep.iep,
            lstVol: iepTrade[iepTrade.length - 1].TradeGenrated,
            lstTime: new Date().toString(),
            totalVol: maxIep.matchedShared,
            high: maxIep.iep, 
            low: maxIep.iep,
            open: totalOrders - closedOrder,
            close: closedOrder
            }
        }).save();
    }else{
        var value = {
            lstPrc : maxIep.iep,
            lstVol : iepTrade[iepTrade.length - 1].TradeGenrated,
            lstTime: new Date().toString(),
            totalVol: maxIep.matchedShared,
            high: maxIep.iep,
            low: maxIep.iep,
            open: totalOrders - closedOrder,
            close: closedOrder
        }
        overview.value = value;
        await overview.save(function (err, overview) {
            if (err) return console.error(err);
          });
    }
    });
  }


  async getMaxIep(possibleResult) {
    console.log("getMaxIep = " + JSON.stringify(possibleResult));
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
      var iepNormalOrderImbalance = await this.getIepByNormalOrderImbalance(
        possibleMaxIeps
      );

      if (iepNormalOrderImbalance.length == 1) {
        console.log(
          "Rule 2: iepNormalOrderImbalance = " +
            JSON.stringify(iepNormalOrderImbalance)
        );
        return iepNormalOrderImbalance[0];
      } else if (iepNormalOrderImbalance.length > 1) {
        var lowerPrice = _.maxBy(iepNormalOrderImbalance, "iep");
        var highestPrice = _.maxBy(iepNormalOrderImbalance, "iep");

        console.log("lowerPrice = " + JSON.stringify(lowerPrice));
        console.log("highestPrice = " + JSON.stringify(highestPrice));

        if (
          iepNormalOrderImbalance[0].accBidQty >
          iepNormalOrderImbalance[0].accAskQty
        ) {
          console.log("Rule 3: accBidQty > acc Ask Qty");
          return highestPrice;
        } else if (
          iepNormalOrderImbalance[0].accBidQty <
          iepNormalOrderImbalance[0].accAskQty
        ) {
          console.log("Rule 3: accBidQty < acc Ask Qty");
          return lowerPrice;
        } else {
          var lastClosingPrice = 0;
          await SessionInformation.findOne(
            { key: "closingPrice" },
            async function (err, phrase) {
              lastClosingPrice = _.get(phrase, "value");
            }
          );

          if (lastClosingPrice === 0) {
            return highestPrice;
          } else {
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
      if (lowerImbalance > _.get(result, "normalOrderImbalance")) {
        lowerImbalance = result.normalOrderImbalance;
      }
    });

    console.log("lowerImbalance = " + lowerImbalance);

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

  async createLog(id, code, request, keyPair) {
    var des = historyList.getHistory(code);
    var history = new OrderHistory({
      orderId: id,
      request: request,
      description: {
        code: code,
        description: des.description
          .replace("%STOCK%", _.get(keyPair, "stock", ""))
          .replace("%OTHER_ORDER_ID%", _.get(keyPair, "otherOrderId", ""))
      },
      createAt: Date.now(),
    });
    await history.save();
  }
}
module.exports = IepService;
