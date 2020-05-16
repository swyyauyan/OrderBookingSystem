var _ = require("lodash");
var SessionInformation = require("../model/sessionInformation");

var IepService = require("./iepService");
var iepService = new IepService();

const DEFAULT_TRADING_PHRASE = "Pre-opening session - Order Input Period";

class TradingPhraseService {
  async get(res) {
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      tradingPhrase
    ) {
      if (tradingPhrase === null) {
        await new SessionInformation({
          key: "tradingPhrase",
          value: DEFAULT_TRADING_PHRASE,
        }).save();

        res.send(DEFAULT_TRADING_PHRASE);
      } else {
        res.send(tradingPhrase.value);
      }
    });
  }

  async set(req, res) {
    var tradingPhraseInput = req.body.tradingPhrase;
    console.log('tradingPhrase = ' + tradingPhraseInput);
    await SessionInformation.findOne({ key: "tradingPhrase" }, async function (
      err,
      tradingPhrase
    ) {
      if (tradingPhrase === null) {
        await new SessionInformation({
          key: "tradingPhrase",
          value: tradingPhraseInput,
        }).save(function (err, doc) {});
      } else {
        tradingPhrase.value = tradingPhraseInput;
        await tradingPhrase.save();
      }
    });
    //TODO: HERE
    if(tradingPhraseInput === 'Pre-opening session - Order matching Period' ){
      console.log('Set iep.');
      await iepService.setIep();
    }
    res.send("Trading phrase = " + tradingPhraseInput);
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

  async getInterval(res) {
    await SessionInformation.findOne({ key: "interval" }, async function (
      err,
      interval
    ) {
      if (interval === null) {
        res.send("without setting interval price.");
      } else {
        res.send(interval.value.toString());
      }
    });
  }

  async setInterval(req, res) {
    var intervalInput = req.body.interval;
    console.log('setInterval: input value = ' + intervalInput);
    await SessionInformation.findOne({ key: "interval" }, async function (
      err,
      intervalRecord
    ) {
      if (intervalRecord === null) {
        await new SessionInformation({
          key: "interval",
          value: intervalInput,
        }).save(function (err, doc) {
          res.send("IntervalInput = " + intervalInput);
        });
      } else {
        intervalRecord.value = intervalInput;
        await intervalRecord.save();
        res.send("IntervalInput = " + intervalInput);
      }
    });
  }
}

module.exports = TradingPhraseService;
