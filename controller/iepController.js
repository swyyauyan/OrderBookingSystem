var IepService = require("../service/IepService");
var iepService = new IepService();

exports.getValue = async function (req, res) {
  var result = await iepService.getValue();
  res.send(result);
};

exports.getPossibleResult = async function (req, res) {
  await iepService.getPossibleResult(res);
};

exports.getTradeResult = async function (req, res) {
  await iepService.getTradeResult(res);
};

