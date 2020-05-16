var express = require("express");
var router = express.Router();
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var SessionInformation = require("../model/sessionInformation");

var IepService = require("../service/iepService");
var iepService = new IepService();

/* GET home page. */
router.get("/", async function (req, res, next) {
  //Get trading phrase
  //Get interval information there

  var orderOverview;
  await SessionInformation.findOne({"key" : "orderOverview"}, function (err, overview) {
    orderOverview = overview;
  });

  if(orderOverview == undefined){
    orderOverview = {
      key: "orderOverview",
            value: {
              lstPrc: 0,
              lstVol: 0,
              lstTime: "-",
              totalVol: 0,
              high: 0, 
              low: 0,
              open: 0,
              close: 0,
            }
    }
  }

  var tradingPhrase = await SessionInformation.findOne({"key" : "tradingPhrase"});

  if(tradingPhrase == undefined){
    tradingPhrase = {
      key: "tradingPhrase",
      value: "Pre-opening session - Order Input Period"
    }
  }

  var interval = await SessionInformation.findOne({"key" : "interval"});

  if(interval == undefined){
    interval = {
      key: "interval",
      value: "Not yet set"
    }
  }

  var iepValue = await iepService.getValue();

  var askOrderBook = await Order.find({ action: "ASK", status: "OPEN" }).sort({
    price: 1,
    createAt: 1
  });
  
  var bidOrderBook = await Order.find({ action: "BID", status: "OPEN" }).sort({
    price: -1,
    createAt: 1
  });

  res.render("index", { title: "Order Booking System", orderOverview: orderOverview, bidOrderBook: bidOrderBook, askOrderBook: askOrderBook, tradingPhrase: tradingPhrase, interval: interval, iepValue: iepValue});
  
});

router.get("/", async function (req, res, next) {
  res.render("index", { title: "Order Booking System", orderOverview: orderOverview, bidOrderBook: bidOrderBook, askOrderBook: askOrderBook, tradingPhrase: tradingPhrase, interval: interval, iepValue: iepValue});
});

router.get("/edit/tradingPhrase", async function (req, res, next) {
  var tradingPhrase = await SessionInformation.findOne({"key" : "tradingPhrase"});

  if(tradingPhrase == undefined){
    tradingPhrase = {
      key: "tradingPhrase",
      value: "Pre-opening session - Order Input Period"
    }
  }

  res.render("editTradingPhrase", { title: "Order Booking System", tradingPhrase:tradingPhrase });
});

router.get("/edit/interval", async function (req, res, next) {
  
  var interval = await SessionInformation.findOne({"key" : "interval"});
  
  if(interval == undefined){
    interval = {
      key: "interval",
      value: "Not yet set"
    }
  }

  res.render("editInterval", { title: "Order Booking System", interval:interval });
});

router.get("/create/order", function (req, res, next) {
  res.render("createOrder",{ title: "Order Booking System" });
});

router.get("/get/order/:id", async function (req, res, next) {
  var orderHistories = await OrderHistory.find({orderId: req.params.id}).sort({
    createAt: -1
  }).limit(100);
  res.render("getOrder", { title: "Order Booking System", orderHistories: orderHistories });
});

router.get("/get/iep/:iepValue", async function (req, res, next) {
  
  var iepResult;
  var iepTrade;

  var tradingPhrase = await SessionInformation.findOne({"key" : "tradingPhrase"});

  if(tradingPhrase == undefined){
    tradingPhrase = {
      key: "tradingPhrase",
      value: "Pre-opening session - Order Input Period"
    }
  }

  if( tradingPhrase.value == "Pre-opening session - Order Input Period" ||
    tradingPhrase.value == "Pre-opening session - Pre-order matching Period"){
    var iepResult = await iepService.getPossibleIepResult(req.params.iepValue);
    var iepTrade = await iepService.getTradeTable(iepResult);
    res.render("getIepDetails", { title: "Order Booking System", iep: req.params.iepValue, iepResult: iepResult , iepTrade: iepTrade });

  }else{
    iepResult = await SessionInformation.findOne({"key" : "iepPossibleResult"});
    iepTrade = await SessionInformation.findOne({"key" : "iepTrade"});
    res.render("getIepDetails", { title: "Order Booking System", iep: req.params.iepValue, iepResult: iepResult.value , iepTrade: iepTrade.value });

  }
  console.log(iepResult);
  console.log(iepTrade);
  // res.render("getIepDetails", { title: "Order Booking System", iep: req.params.iepValue, iepResult: iepResult.value , iepTrade: iepTrade.value });
});

router.get("/get/orderlogs", async function (req, res, next) {

  var orderHistories = await OrderHistory.find().sort({
    createAt: -1
  }).limit(100);

  res.render("getOrderHistory", { title: "Order Booking System", orderHistories: orderHistories });
});


//show iep details

module.exports = router;
