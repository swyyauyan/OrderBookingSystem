var OrderCreationService = require("../service/orderCreationService");
var orderCreationService = new OrderCreationService();

var OrderBookService = require("../service/orderBookService");
var orderBookService = new OrderBookService();

var OrderHistoryService = require("../service/orderHistoryService");
var orderHistoryService = new OrderHistoryService();

exports.getOrders = async function (req, res) {
  orderBookService.get(res);
};

exports.getOrderById = async function (req, res) {
  await orderBookService.getOrderById(req, res);
};

exports.createOrder = function (req, res) {
  res.send(orderCreationService.create(req.body));
};

exports.getHistoriesByOrderId = async function (req, res) {
  await orderHistoryService.getHistoriesByOrderId(req, res);
};