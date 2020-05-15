var express = require("express");
var router = express.Router();
var Order = require("../model/order");
var SessionInformation = require("../model/sessionInformation");

/* GET home page. */
router.get("/", async function (req, res, next) {
  //Get trading phrase
  //Get interval information there

  var orderOverview;
  await SessionInformation.findOne({"key" : "orderOverview"}, function (err, overview) {
    orderOverview = overview;
  });

  var tradingPhrase = await SessionInformation.findOne({"key" : "tradingPhrase"});

  var interval = await SessionInformation.findOne({"key" : "interval"});

  var iepValue = await SessionInformation.findOne({"key" : "iepValue"});

  var askOrderBook = await Order.find({ action: "ASK", status: "OPEN" }).sort({
    price: 1,
  });
  
  var bidOrderBook = await Order.find({ action: "BID", status: "OPEN" }).sort({
    price: -1,
  });

  res.render("index", { title: "Order Booking System", orderOverview: orderOverview, bidOrderBook: bidOrderBook, askOrderBook: askOrderBook, tradingPhrase: tradingPhrase, interval: interval, iepValue: iepValue});
  
});

router.get("/", async function (req, res, next) {
  res.render("index", { title: "Order Booking System", orderOverview: orderOverview, bidOrderBook: bidOrderBook, askOrderBook: askOrderBook, tradingPhrase: tradingPhrase, interval: interval, iepValue: iepValue});
});

router.get("/edit/tradingPhrase", function (req, res, next) {
  res.render("editTradingPhrase");
});

router.get("/edit/interval", async function (req, res, next) {
  
  var interval = await SessionInformation.findOne({"key" : "interval"});

  res.render("editInterval", { title: "Order Booking System", interval });
});

router.get("/create/order", function (req, res, next) {
  res.render("createOrder");
});

router.get("/get/order/:id", function (req, res, next) {
  res.render("getOrder");
});

module.exports = router;
