var express = require("express");
var router = express.Router();

var tradingPhraseController = require("../controller/tradingPhraseController");

router.get("/", tradingPhraseController.getTradingPhrase);

router.post("/", tradingPhraseController.setTradingPhrase);

router.get("/closingPrice", tradingPhraseController.getClosingPrice);

router.post("/closingPrice", tradingPhraseController.setClosingPrice);

router.post("/interval", tradingPhraseController.setInterval);

module.exports = router;