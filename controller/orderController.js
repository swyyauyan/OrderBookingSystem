var OrderCreationService = require("../service/orderCreationService");
var orderCreationService = new OrderCreationService();

var OrderBookService = require("../service/orderBookService");
var orderBookService = new OrderBookService();

var OrderHistoryService = require("../service/orderHistoryService");
var orderHistoryService = new OrderHistoryService();

var OrderOverviewService = require("../service/orderOverviewService");
var orderOverviewService = new OrderOverviewService();

exports.getOrderOverview = async function (req, res){
  await orderOverviewService.get(res);
};

exports.getOrders = async function (req, res) {
  await orderBookService.get(res);
};

exports.getOrderById = async function (req, res) {
  await orderBookService.getOrderById(req, res);
};

exports.createOrder = async function (req, res) {
  await orderCreationService.create(req.body, res);
};

exports.getHistoriesByOrderId = async function (req, res) {
  await orderHistoryService.getHistoriesByOrderId(req, res);
};