var TradingPhraseService = require("../service/tradingPhraseService");
var tradingPhraseService = new TradingPhraseService();

exports.getTradingPhrase = async function (req, res) {
  await tradingPhraseService.get(res);
};

exports.setTradingPhrase = async function (req, res) {
  await tradingPhraseService.set(req, res);
};

exports.getClosingPrice = async function (req, res) {
  await tradingPhraseService.getClosingPrice(res);
};

exports.setClosingPrice = async function (req, res) {
  await tradingPhraseService.setClosingPrice(req, res);
};

exports.getInterval = async function (req, res) {
  await tradingPhraseService.getInterval(res);
};

exports.setInterval = async function (req, res) {
  await tradingPhraseService.setInterval(req, res);
};
