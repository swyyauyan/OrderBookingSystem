var _ = require("lodash");
var SessionInformation = require("../model/sessionInformation");

var OrderHistory = require("../service/orderHistoryService");
var orderHistory = new OrderHistory();

const DEFAULT_TRADING_PHRASE = "Continuous trading";

class TradingPhraseService {
  async get(res) {
    return await this.getPhrase();
  }

  async getPhrase(){
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      tradingPhrase
    ) {
      if (tradingPhrase === null) {
        await new SessionInformation({
          key: "tradingPhrase",
          value: DEFAULT_TRADING_PHRASE,
        }).save();

        return DEFAULT_TRADING_PHRASE;
      } else {
        return tradingPhrase.value;
      }
    });
  }

  async set(req, res) {
    var tradingPhraseInput = req.body.tradingPhrase;
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      tradingPhrase
    ) {
      if (tradingPhrase === null) {
        await new SessionInformation({
          key: "tradingPhrase",
          value: tradingPhraseInput,
        }).save(function (err, doc) {
          res.send("Trading phrase = " + tradingPhraseInput);
        });
      } else {
        tradingPhrase.value = tradingPhraseInput;
        await tradingPhrase.save();
        res.send("Trading phrase = " + tradingPhrase.value);
      }
    });
  }

  async getClosingPrice(res) {
    await SessionInformation.findOne({ key: "closingPrice" }, async function (
      err,
      price
    ) {
      if (price === null) {
        res.send("without setting closing price.");
      } else {
        res.send(price.value);
      }
    });
  }

  async setClosingPrice(req, res) {
    var closingPrice = req.body.closingPrice;
    await SessionInformation.findOne({ key: "closingPrice" }, async function (
      err,
      price
    ) {
      if (price === null) {
        await new SessionInformation({
          key: "closingPrice",
          value: closingPrice,
        }).save(function (err, doc) {
          res.send(closingPrice);
        });
      } else {
        price.value = closingPrice;
        await price.save();
        res.send(closingPrice);
      }
    });
  }

  async canCreateOrder(id, request, orderType){
    var tradingPhrase = await this.getPhrase();

    if(tradingPhrase == DEFAULT_TRADING_PHRASE 
      || tradingPhrase == 'Pre-opening session - Order Input Period' 
      || (tradingPhrase == 'Pre-opening session - Pre-order matching Period' && orderType == 'MARKET')){
      return true;
    }else {
      await orderHistory.createLog(id, 96, request, {'tradingPhrase': tradingPhrase});
      return false;
    }
  }
}

module.exports = TradingPhraseService;
